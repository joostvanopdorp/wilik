// Dutch translations, keyed by the exact English source text (see I18nProvider.jsx).
// Terminology: wishlist = verlanglijstje (plural verlanglijstjes), directory = overzicht van
// verlanglijstjes, claim = reserveren/reservering, reset a claim = een reservering vrijgeven, setup link = activatielink.
const nl = {
  // navigation and shared
  'Language': 'Taal',
  'Close': 'Sluiten',
  'Open menu': 'Menu openen',
  'Close menu': 'Menu sluiten',
  'Wishlists': 'Verlanglijstjes',
  'Received': 'Ontvangen',
  'Settings': 'Instellingen',
  'Admin': 'Beheer',
  'Log out': 'Uitloggen',
  'Loading…': 'Laden…',
  'Save': 'Opslaan',
  'Saved': 'Opgeslagen',
  'Cancel': 'Annuleren',
  'Copy': 'Kopiëren',
  'Copied!': 'Gekopieerd!',
  '← Back': '← Terug',
  '← Back to wishlist': '← Terug naar je verlanglijstje',
  'Something went wrong': 'Er is iets misgegaan',

  // login and account setup
  'Username': 'Gebruikersnaam',
  'Password': 'Wachtwoord',
  'New password': 'Nieuw wachtwoord',
  'Confirm new password': 'Nieuw wachtwoord bevestigen',
  "New passwords don't match": 'De nieuwe wachtwoorden komen niet overeen',
  'Save and continue': 'Opslaan en doorgaan',
  'Saving…': 'Opslaan…',
  'Not you? Log out': 'Ben jij dit niet? Uitloggen',
  'Choose your username and set a password to finish setting up your account':
    'Kies een gebruikersnaam en stel een wachtwoord in om je account in te stellen',
  'User not found': 'Gebruiker niet gevonden',
  'Invalid username or password': 'Ongeldige gebruikersnaam of wachtwoord',
  'Checking…': 'Controleren…',
  'Next': 'Volgende',
  'Logging in…': 'Inloggen…',
  'Log in': 'Inloggen',
  'Stay logged in': 'Ingelogd blijven',
  'Not you? Go back': 'Ben jij dit niet? Ga terug',
  'Go back': 'Terug',
  'Continuing as {username}': 'Doorgaan als {username}',
  "{username}'s account isn't set up yet. Ask your admin for your setup link.":
    'Het account van {username} is nog niet ingesteld. Vraag de beheerder om je activatielink.',
  'This setup link is invalid or has expired. Ask your admin for a new one.':
    'Deze activatielink is ongeldig of verlopen. Vraag de beheerder om een nieuwe.',

  // directory
  "Looking for someone's wishlist?": 'Op zoek naar iemands verlanglijstje?',
  'Browse wishlists': 'Verlanglijstjes bekijken',
  'All wishlists': 'Alle verlanglijstjes',
  'No wishlists available': 'Geen verlanglijstjes beschikbaar',
  'Either there are none yet, or the owner turned this overview off':
    'Er zijn er nog geen, of de beheerder heeft dit overzicht uitgeschakeld',

  // public wishlist
  'Link not found': 'Link niet gevonden',
  "This wishlist link doesn't exist (anymore)": 'Deze link naar een verlanglijstje bestaat niet (meer)',
  "Claim an item by clicking {button} so others know it's taken. The recipient won't be notified.":
    'Reserveer een cadeau door op {button} te klikken, zodat anderen weten dat het gereserveerd is. De ontvanger krijgt hier geen melding van.',
  'Get this gift': 'Dit cadeau reserveren',
  'Sort': 'Sorteren',
  'Highest rated': 'Hoogste beoordeling',
  'Lowest price': 'Laagste prijs',
  'Label': 'Label',
  'Brand': 'Merk',
  'All': 'Alle',
  '{count} selected': '{count} geselecteerd',
  'No items match your filters': 'Geen cadeaus gevonden met deze filters',
  'Try a different label or brand': 'Probeer een ander label of merk',
  'Clear filters': 'Filters wissen',
  'This wishlist is empty': 'Dit verlanglijstje is leeg',
  'Nothing has been added yet, check back later': 'Er is nog niets toegevoegd, kom later nog eens kijken',
  "Your name, so others know it's taken:": 'Je naam, zodat anderen weten dat het cadeau gereserveerd is:',
  'Confirm your name to manage this claim:': 'Bevestig je naam om deze reservering te beheren:',
  'Confirm your name to manage your claim:': 'Bevestig je naam om je reservering te beheren:',
  'Already claimed this? Manage your claim': 'Heb je dit al gereserveerd? Beheer je reservering',
  'Release this gift': 'Reservering intrekken',
  'Gift claimed': 'Cadeau gereserveerd',
  'Gift claimed — click to unclaim': 'Cadeau gereserveerd — klik om je reservering in te trekken',
  'Fully claimed': 'Volledig gereserveerd',
  'Fully claimed ({count} of {quantity})': 'Volledig gereserveerd ({count} van {quantity})',
  'Also get this gift ({count} of {quantity} claimed)': 'Dit cadeau ook reserveren ({count} van {quantity} gereserveerd)',
  'Also get this gift ({count} claimed)': 'Dit cadeau ook reserveren ({count} gereserveerd)',

  // own wishlist and received
  'My wishlist': 'Mijn verlanglijstje',
  'See and manage the items on your own wishlist': 'Bekijk en beheer de cadeaus op je eigen verlanglijstje',
  'Go to my wishlist': 'Naar mijn verlanglijstje',
  "Browse everyone's wishlists, so you can claim something to give them":
    'Bekijk ieders verlanglijstje en reserveer iets om te geven',
  "Items you've already got, kept off your active wishlist":
    'Cadeaus die je al gekregen hebt, apart van je actieve verlanglijstje',
  'Nothing here yet': 'Nog niets ontvangen',
  'Mark a wishlist item as received to archive it': 'Markeer een cadeau als ontvangen om het hier te archiveren',
  'Your wishlist is empty': 'Je verlanglijstje is leeg',
  'Loading your wishlist…': 'Je verlanglijstje wordt geladen…',
  'Gifts can only be reordered within the same star rating.':
    'Cadeaus kunnen alleen binnen hetzelfde aantal sterren van plaats wisselen.',
  'Add your first gift idea to get started': 'Voeg je eerste cadeau-idee toe om te beginnen',
  'New item': 'Nieuw cadeau',

  // gift card and claim management
  'Rating': 'Beoordeling',
  'Drag to reorder within this star rating': 'Sleep om de volgorde binnen dit aantal sterren te wijzigen',
  'Manage claims': 'Reserveringen beheren',
  'Move back to wishlist': 'Terugzetten op je verlanglijstje',
  'Edit': 'Bewerken',
  'Delete': 'Verwijderen',
  'has no active claims': 'heeft geen actieve reserveringen',
  'has {count} active claim': 'heeft {count} actieve reservering',
  'has {count} active claims': 'heeft {count} actieve reserveringen',
  'Names stay hidden until you choose to reveal\u00A0them': 'Namen blijven verborgen tot je ze zichtbaar\u00A0maakt',
  'Claimed by': 'Gereserveerd door',
  'Reveal name': 'Naam tonen',
  'Reveal names': 'Namen tonen',
  'Reset claim': 'Reservering vrijgeven',
  'Reset all claims': 'Alle reserveringen vrijgeven',
  'Could not reveal claimants': 'Kon de namen niet tonen',
  'Could not reset claims': 'Kon de reserveringen niet vrijgeven',
  'Reset the claim for "{title}"? Visitors will be able to claim it again.':
    'De reservering voor "{title}" vrijgeven? Bezoekers kunnen het daarna opnieuw reserveren.',
  'Reset all {count} claims for "{title}"? Visitors will be able to claim it again.':
    'Alle {count} reserveringen voor "{title}" vrijgeven? Bezoekers kunnen het daarna opnieuw reserveren.',
  'Delete "{title}"?': '"{title}" verwijderen?',
  'Delete claimed item?': 'Gereserveerd cadeau verwijderen?',
  '“{title}” has been claimed by {claimants}: reveal who, or delete without knowing':
    '“{title}” is gereserveerd door {claimants}: bekijk door wie, of verwijder zonder het te weten',
  'someone': 'iemand',
  '{count} people': '{count} mensen',
  'If you already got this gift, use the checkmark instead to archive it to your list of received items.':
    'Heb je dit cadeau al gekregen? Gebruik dan het vinkje om het naar je ontvangen cadeaus te verplaatsen.',
  'Delete without knowing': 'Verwijderen zonder het te weten',
  "This item has unlimited quantity, so marking it received won't remove it from your list. It'll just clear the {count} existing claim so people can keep gifting it. Continue?":
    'Dit cadeau heeft een onbeperkt aantal. Als je het als ontvangen markeert, blijft het op je lijst staan. Alleen de bestaande reservering wordt gewist, zodat anderen het kunnen blijven geven. Doorgaan?',
  "This item has unlimited quantity, so marking it received won't remove it from your list. It'll just clear the {count} existing claims so people can keep gifting it. Continue?":
    'Dit cadeau heeft een onbeperkt aantal. Als je het als ontvangen markeert, blijft het op je lijst staan. Alleen de {count} bestaande reserveringen worden gewist, zodat anderen het kunnen blijven geven. Doorgaan?',
  "This item has unlimited quantity, so marking it received won't remove it from your list. Continue?":
    'Dit cadeau heeft een onbeperkt aantal. Als je het als ontvangen markeert, blijft het op je lijst staan. Doorgaan?',

  // gift form
  'URL': 'URL',
  'Fetching…': 'Ophalen…',
  'Fetch details': 'Gegevens ophalen',
  'Could not fetch details for that URL': 'Kon geen gegevens ophalen van die URL',
  'Image URL': 'Afbeeldings-URL',
  'Preview': 'Voorbeeld',
  'Brand, creator or seller': 'Merk, maker of verkoper',
  'Title': 'Titel',
  'e.g. Board game, Perfume, Book ...': 'bijv. Gezelschapsspel, Parfum, Boek ...',
  'e.g. 999 Games, Chanel, George Orwell ...': 'bijv. 999 Games, Chanel, George Orwell ...',
  'e.g. Rummikub, Bleu de Chanel, Animal Farm ...': 'bijv. Rummikub, Bleu de Chanel, Animal Farm ...',
  'Product options (separate with semicolons)': 'Productopties (scheiden met puntkomma’s)',
  'e.g. Medium; 50ml; Black, blue or yellow': 'bijv. Medium; 50 ml; Zwart, blauw of geel',
  'Description': 'Beschrijving',
  'Any extra details worth mentioning': 'Extra details die het vermelden waard zijn',
  'Price': 'Prijs',
  'Currency': 'Valuta',
  'Default ({currency})': 'Standaard ({currency})',
  'no symbol': 'geen symbool',
  'Quantity': 'Aantal',
  'Unlimited (anyone can claim a copy, it never runs out)':
    'Onbeperkt aantal (iedereen kan er een reserveren, blijft altijd beschikbaar)',

  // option labels from formOptions.js and themePresets.js
  '€ Euro': '€ Euro',
  '$ Dollar': '$ Dollar',
  '£ Pound': '£ Pond',
  'No currency': 'Geen valuta',
  ', (comma)': ', (komma)',
  '. (period)': '. (punt)',
  'Round to whole number': 'Afronden op geheel getal',
  'Teal': 'Blauwgroen',
  'Blurple': 'Blauwpaars',
  'Gold': 'Goud',
  'Burnt orange': 'Donkeroranje',
  'Magenta': 'Magenta',

  // settings
  'Share your wishlist': 'Deel je verlanglijstje',
  'Anyone with this link can view your list and claim items.':
    'Iedereen met deze link kan je lijst bekijken en cadeaus reserveren.',
  'Generate new link': 'Nieuwe link maken',
  'Generate a new link? Your old share link will stop working.':
    'Een nieuwe link maken? Je oude deellink werkt dan niet meer.',
  'List my wishlist in the browsable directory': 'Mijn verlanglijstje tonen in het overzicht van verlanglijstjes',
  'Wishlist settings': 'Instellingen verlanglijstje',
  'General': 'Algemeen',
  'List name': 'Naam van de lijst',
  'Decimals': 'Decimalen',
  'Appearance': 'Weergave',
  'Theme color': 'Themakleur',
  'Show a placeholder image for items without a photo': 'Toon een standaardafbeelding bij cadeaus zonder foto',
  'Show a subtle background pattern on gift cards': 'Toon een subtiel achtergrondpatroon op de cadeautegels',
  'Guest sorting & filtering': 'Sorteren en filteren voor bezoekers',
  'Lets guests browsing your list narrow it down themselves. This is handy for longer lists.':
    'Bezoekers kunnen je lijst zelf sorteren en filteren. Handig voor langere lijsten.',
  'Let guests also sort by price': 'Bezoekers ook laten sorteren op prijs',
  'Let guests filter by label': 'Bezoekers laten filteren op label',
  'Let guests filter by brand': 'Bezoekers laten filteren op merk',
  'Claim management': 'Reserveringen beheren',
  'Caution!': 'Let op!',
  'Claims normally stay hidden and anonymous to preserve the surprise. This lets you deliberately reveal or reset them.':
    'Reserveringen blijven normaal verborgen en anoniem, zodat de verrassing intact blijft. Hiermee kun je ze bewust zichtbaar maken of vrijgeven.',
  'Let me reveal and manage claims on this wishlist': 'Ik wil reserveringen op dit verlanglijstje kunnen zien en beheren',
  'Only show the lock icon on already-claimed items': 'Toon het slotje alleen bij cadeaus die al gereserveerd zijn',
  'not recommended': 'niet aanbevolen',
  'Account settings': 'Accountinstellingen',
  'Change username': 'Gebruikersnaam wijzigen',
  'Change password': 'Wachtwoord wijzigen',
  'Password changed': 'Wachtwoord gewijzigd',
  'App theme': 'Appthema',
  "Only changes how the app looks for you. Wishlist visitors aren't affected.":
    'Verandert alleen hoe de app er voor jou uitziet. Bezoekers van je verlanglijstje merken hier niets van.',
  'Dark': 'Donker',
  'Light': 'Licht',
  'Match system': 'Systeeminstelling volgen',
  "Only changes the language of the app for you. Wishlist visitors aren't affected.":
    'Verandert alleen de taal van de app voor jou. Bezoekers van je verlanglijstje merken hier niets van.',
  'Show a language button in the navigation bar': 'Toon een taalknop in de navigatiebalk',
  'Default ({language})': 'Standaard ({language})',

  // admin
  'Admin panel': 'Beheerpaneel',
  'admin': 'beheerder',
  'setup pending': 'nog niet ingesteld',
  'User management': 'Gebruikersbeheer',
  'Edit user': 'Gebruiker bewerken',
  'Delete user': 'Gebruiker verwijderen',
  'Manage user: {username}': 'Gebruiker beheren: {username}',
  'Reset password': 'Wachtwoord opnieuw instellen',
  'Reset password without a setup link, allow first login with just a username':
    'Wachtwoord opnieuw instellen zonder activatielink, eerste keer inloggen met alleen een gebruikersnaam toestaan',
  'Dismiss': 'Sluiten',
  'Admin access': 'Beheerdersrechten',
  'This user has admin access': 'Deze gebruiker heeft beheerdersrechten',
  'List this wishlist in the browsable directory': 'Dit verlanglijstje tonen in het overzicht van verlanglijstjes',
  "Lets guests browsing this user's list narrow it down themselves. This is handy for longer lists.":
    'Bezoekers kunnen de lijst van deze gebruiker zelf sorteren en filteren. Handig voor langere lijsten.',
  'Claims normally stay hidden and anonymous to preserve the surprise. This lets this user deliberately reveal or reset them.':
    'Reserveringen blijven normaal verborgen en anoniem, zodat de verrassing intact blijft. Hiermee kan deze gebruiker ze bewust zichtbaar maken of vrijgeven.',
  'Let this user reveal and manage claims on their wishlist':
    'Deze gebruiker reserveringen op het eigen verlanglijstje laten zien en beheren',
  'Add new user': 'Nieuwe gebruiker toevoegen',
  'Make this user an admin': 'Deze gebruiker beheerder maken',
  'Allow first login with just a username, no setup link':
    'Eerste keer inloggen met alleen een gebruikersnaam toestaan, zonder activatielink',
  'Add user': 'Gebruiker toevoegen',
  'Adding…': 'Toevoegen…',
  "{username} can log in immediately with just their username. They'll be asked to set a password.":
    '{username} kan meteen inloggen met alleen de gebruikersnaam en moet daarna een wachtwoord kiezen.',
  "{username} can log in immediately with just their username. They'll be asked to set a new password.":
    '{username} kan meteen inloggen met alleen de gebruikersnaam en moet daarna een nieuw wachtwoord kiezen.',
  "{username} can't log in until they use this one-time setup link:":
    '{username} kan pas inloggen na het gebruiken van deze eenmalige activatielink:',
  "{username} can't log in yet. Send them this one-time setup link:":
    '{username} kan nog niet inloggen. Stuur deze eenmalige activatielink door:',
  'Delete {username}? Their wishlist will be deleted too.':
    '{username} verwijderen? Het verlanglijstje van deze gebruiker wordt ook verwijderd.',
  "Reset {username}'s password? They'll set a new one next time they log in.":
    'Het wachtwoord van {username} opnieuw instellen? Bij de volgende keer inloggen moet een nieuw wachtwoord gekozen worden.',
  'Discard unsaved changes?': 'Niet-opgeslagen wijzigingen weggooien?',
  'Gift directory': 'Overzicht van verlanglijstjes',
  'Show a directory of public wishlists on the login page':
    'Toon een overzicht van openbare verlanglijstjes op de inlogpagina',
  'Allow wishlist owners to opt into revealing and resetting claims on their own list':
    'Eigenaars van verlanglijstjes toestaan om reserveringen op hun eigen lijst zichtbaar te maken en vrij te geven',
  'Skip the warning when deleting an already-claimed item':
    'Waarschuwing overslaan bij het verwijderen van een cadeau dat al gereserveerd is',
  'App name': 'Appnaam',
  'Change app name': 'Appnaam wijzigen',
  'Default theme': 'Standaardthema',
  'Default look for anyone without their own preference set, including wishlist visitors.':
    'Standaardweergave voor iedereen zonder eigen voorkeur, ook voor bezoekers van verlanglijstjes.',
  'Default language': 'Standaardtaal',
  'Default language for anyone without their own preference set, including wishlist visitors.':
    'Standaardtaal voor iedereen zonder eigen voorkeur, ook voor bezoekers van verlanglijstjes.',
  'Match browser language': 'Browsertaal volgen',
  'Show a language button for visitors (public wishlists, directory and login)':
    'Toon een taalknop voor bezoekers (openbare verlanglijstjes, overzicht en inlogpagina)',
  'Version: backend {backend} · frontend {frontend}': 'Versie: backend {backend} · frontend {frontend}',

  // errors returned by the backend (backend/routes/*.py), shown via t(data.error);
  // keep these keys identical to the backend's English messages
  'Admin only': 'Alleen voor beheerders',
  'Already claimed': 'Al gereserveerd',
  "App name can't be empty": 'De appnaam mag niet leeg zijn',
  'Claim it first': 'Reserveer het eerst',
  'Claim management is disabled for this wishlist': 'Reserveringen beheren is uitgeschakeld voor dit verlanglijstje',
  'Could not fetch that URL': 'Kon die URL niet ophalen',
  'Enter your name': 'Vul je naam in',
  'Invalid color scheme': 'Ongeldig kleurenschema',
  'Invalid currency': 'Ongeldige valuta',
  'Invalid decimal separator': 'Ongeldig decimaalteken',
  'Invalid language': 'Ongeldige taal',
  'Invalid theme color': 'Ongeldige themakleur',
  'Login required': 'Je moet ingelogd zijn',
  'New password must be at least 8 characters': 'Het nieuwe wachtwoord moet minstens 8 tekens lang zijn',
  'Not found': 'Niet gevonden',
  'Not logged in': 'Niet ingelogd',
  'Not your item': 'Dit cadeau is niet van jou',
  'Nothing to do': 'Er is niets te doen',
  "That URL can't be fetched": 'Die URL kan niet worden opgehaald',
  "That name doesn't match this claim": 'Die naam komt niet overeen met deze reservering',
  'This setup link is invalid or has expired': 'Deze activatielink is ongeldig of verlopen',
  'URL is required': 'Een URL is verplicht',
  'Use account settings to change your own password': 'Wijzig je eigen wachtwoord via je accountinstellingen',
  'Username already taken': 'Deze gebruikersnaam is al in gebruik',
  "Username can't be empty": 'De gebruikersnaam mag niet leeg zijn',
  "Wishlist name can't be empty": 'De naam van het verlanglijstje mag niet leeg zijn',
  "You can't delete your own account": 'Je kunt je eigen account niet verwijderen',
  // the lockout message is an f-string in auth.py, so Login.jsx rebuilds it from this
  // template; the placeholder is named like the Python variable so check-translations
  // can match the two. {unit} only exists in the Dutch text, for minuut/minuten
  'Too many failed attempts. Try again in {minutes_left} minute(s).':
    'Te veel mislukte pogingen. Probeer het over {minutes_left} {unit} opnieuw.',
  'minute': 'minuut',
  'minutes': 'minuten',
}

export default nl
