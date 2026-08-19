from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from helpers import CURRENCY_OPTIONS
from models import AppSettings, Gift, db

items_bp = Blueprint("items", __name__, url_prefix="/api")


def claim_management_active():
    # a wishlist's own opt-in only takes effect while the admin also allows the
    # feature site-wide -- both gates are checked here. Governs the *passive* surface
    # (claimed_count in the item list, the lock icon, resetting claims) so simply
    # browsing a wishlist can't reveal which items are claimed without opting in.
    site_settings = AppSettings.query.get(1)
    return current_user.claim_management_enabled and site_settings.claim_management_site_enabled


def owner_gift_dict(gift):
    return gift.to_dict(include_claim_status=claim_management_active())


@items_bp.route("/items")
@login_required
def get_items():
    gifts = Gift.query.filter_by(owner_id=current_user.id).all()
    return jsonify([owner_gift_dict(gift) for gift in gifts])


@items_bp.route("/items/<int:item_id>/rating", methods=["PATCH"])
@login_required
def update_rating(item_id):
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    data = request.get_json()
    gift.rating = data["rating"]
    gift.sort_order = None  # a rating change moves the item to a new group, drop its old manual position
    db.session.commit()
    return jsonify(owner_gift_dict(gift))


@items_bp.route("/items/<int:item_id>/received", methods=["PATCH"])
@login_required
def update_received(item_id):
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    data = request.get_json()
    new_received = bool(data.get("received", True))

    # unlimited items never "run out" -- receiving one round doesn't mean the owner is
    # done wanting more, so keep it on the active list and just clear existing claims
    # instead of archiving it away like a normal (finite-quantity) item
    if gift.quantity is None and new_received:
        for claim in list(gift.claims):
            db.session.delete(claim)
        db.session.commit()
        return jsonify(owner_gift_dict(gift))

    gift.received = new_received
    db.session.commit()
    return jsonify(owner_gift_dict(gift))


@items_bp.route("/items", methods=["POST"])
@login_required
def create_item():
    data = request.get_json()
    currency = data.get("currency")
    if currency is not None and currency not in CURRENCY_OPTIONS:
        return jsonify({"error": "Invalid currency"}), 400
    gift = Gift(
        owner_id=current_user.id,
        title=data["title"],
        label=data.get("label"),
        brand=data.get("brand"),
        options=data.get("options"),
        url=data.get("url"),
        image_url=data.get("image_url"),
        description=data.get("description"),
        price=data.get("price"),
        currency=currency,
        quantity=data.get("quantity", 1),
        rating=data.get("rating"),
    )
    db.session.add(gift)
    db.session.commit()
    return jsonify(owner_gift_dict(gift)), 201


@items_bp.route("/items/<int:item_id>", methods=["PUT"])
@login_required
def update_item(item_id):
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    data = request.get_json()
    gift.title = data.get("title", gift.title)
    gift.label = data.get("label", gift.label)
    gift.brand = data.get("brand", gift.brand)
    gift.options = data.get("options", gift.options)
    gift.url = data.get("url", gift.url)
    gift.image_url = data.get("image_url", gift.image_url)
    gift.description = data.get("description", gift.description)
    gift.price = data.get("price", gift.price)

    if "currency" in data:
        new_currency = data["currency"]
        if new_currency is not None and new_currency not in CURRENCY_OPTIONS:
            return jsonify({"error": "Invalid currency"}), 400
        gift.currency = new_currency

    gift.quantity = data.get("quantity", gift.quantity)

    new_rating = data.get("rating", gift.rating)
    if new_rating != gift.rating:
        gift.sort_order = None  # rating change moves the item to a new group, drop its old manual position
    gift.rating = new_rating

    if "sort_order" in data:
        gift.sort_order = data["sort_order"]

    db.session.commit()
    return jsonify(owner_gift_dict(gift))


@items_bp.route("/items/<int:item_id>", methods=["DELETE"])
@login_required
def delete_item(item_id):
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    db.session.delete(gift)
    db.session.commit()
    return "", 204


@items_bp.route("/items/<int:item_id>/claim-info", methods=["GET"])
@login_required
def item_claim_info(item_id):
    # Count-only preflight for destructive owner actions. Keeping names out of
    # this response prevents it from bypassing the wishlist's reveal opt-in.
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    return jsonify({"claimed_count": len(gift.claims)})


@items_bp.route("/items/<int:item_id>/claims", methods=["GET"])
@login_required
def item_claims(item_id):
    # unlike the passive surface gated by claim_management_active() (the lock icon,
    # claimed_count in the item list, resetting), an owner can always deliberately
    # reveal a name one at a time -- e.g. right before deleting a claimed item -- no
    # matter the claim management settings. Before this feature existed, deleting a
    # claimed item always showed who claimed it with no opt-in at all; this keeps
    # that capability available, just requiring an explicit click instead of showing
    # it automatically.
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    return jsonify({"claimed_by": [claim.claimed_by for claim in gift.claims]})


@items_bp.route("/items/<int:item_id>/claims", methods=["DELETE"])
@login_required
def reset_item_claims(item_id):
    gift = db.get_or_404(Gift, item_id)
    if gift.owner_id != current_user.id:
        return jsonify({"error": "Not your item"}), 403
    if not claim_management_active():
        return jsonify({"error": "Claim management is disabled for this wishlist"}), 403

    for claim in list(gift.claims):
        db.session.delete(claim)
    db.session.commit()
    return jsonify(owner_gift_dict(gift))
