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
#   script-src ne contient PAS 'unsafe-inline' : le gros du JavaScript est dans
#   des fichiers (assets/site.js, assets/blog-list.js), donc 'self' suffit.
#   Deux exceptions, les scripts de thème — celui de l'accueil (index.html) et
#   celui du blog (inline_js() dans _cron/build-blog.php). Ils posent le mode
#   lecture avant le premier rendu ET portent la bascule qui permet d'en sortir :
#   ils doivent rester en ligne, sans dépendance réseau. D'où les deux empreintes.
#   /!\ Une empreinte change dès qu'on touche à l'un de ces deux scripts.
#   ./publier.sh publie le détecte et affiche la valeur à coller ici. Sans ça le
#   navigateur refuse le script, et le mode lecture devient inatteignable.
#   style-src garde 'unsafe-inline' : tout le CSS est encore inline.
#   data: sert au favicon SVG et à la texture de grain.
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-KyRX8yLdt8Ot0Nr6KyLMq2jy6cw567KnpYw9avnPh2A=' 'sha256-co5sw6VxZjrfaEV6BO4PXwYZrLJk1VAs9Ulm8OHbdSU='; connect-src 'self'" always;
