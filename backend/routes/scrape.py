import ipaddress
import json
import socket
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from flask import Blueprint, jsonify, request
from flask_login import login_required

SCRAPE_MAX_BYTES = 5 * 1024 * 1024
MAX_SCRAPE_REDIRECTS = 5
# different sites' bot detection disagrees on what looks suspicious: some (e.g.
# coolblue.be's AWS WAF) block a bare bot UA outright since a real browser always
# sends a full header set alongside it; others (e.g. decathlon.pl) do the opposite
# and block a browser-like UA specifically *because* the rest of the request (TLS/
# JA3 fingerprint, no JS execution) doesn't actually match a browser, while they
# let an honestly-labeled bot through. No single header set satisfies both, so
# scrape_url() tries the honest one first and only falls back to the disguised one
# on failure.
SCRAPE_HEADERS_BOT = {"User-Agent": "Mozilla/5.0 (compatible; WilikBot/1.0)"}
SCRAPE_HEADERS_BROWSER = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
}

scrape_bp = Blueprint("scrape", __name__, url_prefix="/api")


def resolve_safe_addrinfo(hostname):
    """Resolves hostname and returns its addrinfo only if every address is public
    (never loopback/private/link-local/reserved/multicast); otherwise None."""
    try:
        addrinfo = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return None
    for family, _, _, _, sockaddr in addrinfo:
        ip = ipaddress.ip_address(sockaddr[0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return None
    return addrinfo


def is_safe_scrape_url(url):
    """Blocks SSRF: only allow public http(s) hosts, never loopback/private/link-local addresses."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    return resolve_safe_addrinfo(parsed.hostname) is not None


@scrape_bp.route("/scrape", methods=["POST"])
@login_required
def scrape_url():
    data = request.get_json()
    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "URL is required"}), 400
    if not is_safe_scrape_url(url):
        return jsonify({"error": "That URL can't be fetched"}), 400

    def fetch(headers):
        # allow_redirects=False + manual follow: a redirect target is never re-checked by
        # is_safe_scrape_url() above, so a public URL could otherwise 302 to an internal
        # address (or DNS-rebind to one) and slip past the up-front check entirely
        current_url = url
        for _ in range(MAX_SCRAPE_REDIRECTS + 1):
            hostname = urlparse(current_url).hostname
            addrinfo = resolve_safe_addrinfo(hostname)
            if addrinfo is None:
                raise requests.RequestException("Redirected to an unsafe URL")
            # Pin the connection to the addresses just validated instead of letting the
            # socket layer re-resolve the hostname: otherwise an attacker-controlled name
            # could resolve to a public IP here and a private one a moment later when the
            # actual TCP connection is made (DNS rebinding).
            real_getaddrinfo = socket.getaddrinfo
            socket.getaddrinfo = lambda host, *a, _ai=addrinfo, _host=hostname, **kw: (
                _ai if host == _host else real_getaddrinfo(host, *a, **kw)
            )
            try:
                response = requests.get(current_url, timeout=5, headers=headers, stream=True, allow_redirects=False)
            finally:
                socket.getaddrinfo = real_getaddrinfo
            if response.is_redirect or response.is_permanent_redirect:
                location = response.headers.get("Location")
                response.close()
                if not location:
                    raise requests.RequestException("Redirect with no Location header")
                current_url = urljoin(current_url, location)
                continue
            response.raise_for_status()
            # product price data (JSON-LD) is often placed in <body>, not <head>, so read
            # a generous prefix rather than stopping at </head>
            chunks = bytearray()
            for chunk in response.iter_content(chunk_size=64 * 1024):
                chunks += chunk
                if len(chunks) >= SCRAPE_MAX_BYTES:
                    break
            return bytes(chunks)
        raise requests.RequestException("Too many redirects")

    try:
        content = fetch(SCRAPE_HEADERS_BOT)
    except requests.RequestException:
        try:
            content = fetch(SCRAPE_HEADERS_BROWSER)
        except requests.RequestException:
            return jsonify({"error": "Could not fetch that URL"}), 400

    soup = BeautifulSoup(content, "html.parser")

    def meta(*keys):
        for key in keys:
            tag = soup.find("meta", property=key) or soup.find("meta", attrs={"name": key})
            if tag and tag.get("content", "").strip():
                return tag["content"].strip()
        return None

    products = list(find_jsonld_products(soup))

    og_title = meta("og:title")
    og_description = meta("og:description")
    # some sites (e.g. Amazon) reuse one generic value for every og:title/og:description
    # on every page instead of real per-page content; JSON-LD is more trustworthy then
    og_is_generic = og_title is not None and og_title == og_description
    fallback_title = soup.title.string.strip() if soup.title and soup.title.string else None

    result = {
        "title": (None if og_is_generic else og_title) or jsonld_value(products, "name") or fallback_title,
        "image_url": (None if og_is_generic else meta("og:image", "og:image:url")) or jsonld_image(products),
        "brand": meta("product:brand", "og:brand") or jsonld_brand(products),
    }

    price = meta("product:price:amount", "og:price:amount") or jsonld_price(products)
    if price is not None:
        try:
            result["price"] = float(price)
        except (TypeError, ValueError):
            pass

    return jsonify(result)


def find_jsonld_products(soup):
    """Every schema.org Product/Book-like object on the page, including nested
    variants/editions (ProductGroup.hasVariant, Book.workExample, ...) that sites
    often use to carry the actual price instead of a top-level offer."""
    products = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (TypeError, ValueError):
            continue

        blocks = data if isinstance(data, list) else [data]
        items = []
        for block in blocks:
            if isinstance(block, dict) and isinstance(block.get("@graph"), list):
                items.extend(block["@graph"])
            else:
                items.append(block)

        for item in list(items):
            if not isinstance(item, dict):
                continue
            for key in ("hasVariant", "workExample"):
                if isinstance(item.get(key), list):
                    items.extend(item[key])

        for item in items:
            if not isinstance(item, dict):
                continue
            item_types = item.get("@type", "")
            item_types = item_types if isinstance(item_types, list) else [item_types]
            if any(t and ("product" in str(t).lower() or "book" in str(t).lower()) for t in item_types):
                products.append(item)
    return products


def jsonld_price(products):
    for product in products:
        offers = product.get("offers")
        if isinstance(offers, list):
            offers = offers[0] if offers else None
        if not isinstance(offers, dict):
            continue
        price = offers.get("price") or (offers.get("priceSpecification") or {}).get("price")
        if price:
            return price
    return None


def jsonld_image(products):
    for product in products:
        image = product.get("image")
        if isinstance(image, list):
            image = image[0] if image else None
        if isinstance(image, dict):
            image = image.get("url")
        if image:
            return image
    return None


def jsonld_brand(products):
    for product in products:
        brand = product.get("brand")
        if isinstance(brand, dict):
            brand = brand.get("name")
        if brand:
            return brand
    return None


def jsonld_value(products, key):
    for product in products:
        value = product.get(key)
        if value:
            return value
    return None
