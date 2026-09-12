# ============================================================================
#  En-têtes de sécurité — fafchamps.be
#  Inclus DEUX fois dans le vhost : dans le bloc server, et dans le bloc
#  location des fichiers statiques. Ce n'est pas une redondance : dès qu'un
#  bloc location déclare un add_header, il annule TOUS ceux hérités du parent.
#  Sans la seconde inclusion, images, CSS et JS repartiraient sans en-tête.
# ============================================================================

# HSTS. Le proxy en amont sert déjà « max-age=31536000 » sans includeSubDomains ;
# celui-ci arrive en premier dans la réponse et c'est donc lui que le navigateur
# retient (RFC 6797 §8.1 : seul le premier en-tête STS est traité).
# Pas de « preload » : l'inscription dans la liste des navigateurs est
# difficilement réversible, et rien ne l'impose ici.
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Empêche le navigateur de deviner un type MIME à la place de celui déclaré.
add_header X-Content-Type-Options "nosniff" always;

# Le référent complet n'est envoyé qu'en interne ; vers l'extérieur, l'origine seule.
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Rien de tout cela n'est utilisé par le site : autant le déclarer.
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;

# CSP. Le site n'a aucune dépendance externe hormis Google Fonts.
#   script-src ne contient PAS 'unsafe-inline' : tout le JavaScript a été sorti
#   dans des fichiers (assets/site.js, blog-list.js, blog-read.js), donc 'self'
#   suffit. Seule exception, le script anti-clignotement du mode lecture : il
#   doit s'exécuter avant le rendu, il reste donc inline et est autorisé par son
#   empreinte. Ce script est figé dans le générateur ; s'il change un jour, il
#   faut recalculer l'empreinte, sinon le thème clignote au chargement.
#   style-src garde 'unsafe-inline' : tout le CSS est encore inline.
#   data: sert au favicon SVG et à la texture de grain.
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-7B7r0MF69gvCOx77eqmph4VIrQNxJlXrY6nq4qMVuZs='; connect-src 'self'" always;
