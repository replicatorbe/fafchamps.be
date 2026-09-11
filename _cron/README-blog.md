# _cron/ — Publications (blog)

Générateur statique des articles de fafchamps.be. Même principe que le reste du
site : **tout tient dans le dossier**, aucune dépendance de build, aucune base
de données.

## Fichiers

| Fichier | Rôle |
|---|---|
| `build-blog.php` | Script (CLI uniquement) : `_posts/*.md` → `blog/`, `sitemap.xml`, `data/blog.json` |
| `new-post.php` | Crée le squelette d'un article dans `_posts/` |
| `lib-slug.php` | Slugification partagée par les deux |

Sources et sortie : `_posts/` (Markdown) et `blog/` (HTML généré) — **tous deux
hors du dépôt public**, cf. `.gitignore`.

## Écrire un article

```bash
cd /var/www/sites/fafchamps.be

# 1. créer le squelette (date facultative : par défaut maintenant)
./publier.sh nouveau "Durcir nginx sans casser le TLS" 2019-03-14

# 2. écrire
nano _posts/2019-03-14-durcir-nginx-sans-casser-le-tls.md

# 3. passer status: draft -> published, puis générer
./publier.sh publie
```

`publier.sh` est un simple enrobage de `docker exec`. **Passe par lui**, ou
reprends son option `-u` si tu appelles les scripts à la main :

```bash
docker exec -u "$(id -u):$(id -g)" shared-php \
        php /var/www/fafchamps.be/_cron/build-blog.php
```

Sans `-u`, PHP tourne en `root` dans le conteneur : les fichiers créés dans
`_posts/` appartiennent alors à `root` et ne sont plus éditables depuis l'hôte
(nano échoue à l'enregistrement), et tout ce qui est généré dans `blog/` le
devient aussi.

C'est tout : `blog/index.html`, `blog/<slug>/index.html`, `blog/feed.xml`,
`sitemap.xml` et `data/blog.json` sont réécrits à chaque passage.

## Front-matter

```yaml
---
title:    "Titre de l'article"    # obligatoire
date:     2019-03-14 09:20        # obligatoire (heure facultative)
slug:     durcir-nginx            # facultatif — déduit du titre/nom de fichier
ref:      k7m2q9xd                # facultatif — jeton aléatoire, aucun ordre
updated:  2020-01-08              # facultatif — affiché « mis à jour le … »
category: Infrastructure          # facultatif — une seule ; défaut « Divers »
tags:     [nginx, tls]            # facultatif — autant qu'on veut
summary:  "…"                     # facultatif — sinon 1er paragraphe tronqué
status:   published               # published | draft | unlisted
---
```

`category` accepte aussi l'orthographe `categorie`. Le libellé est repris tel
qu'écrit ; le slug de l'URL en est dérivé (`Infrastructure` →
`/blog/categorie/infrastructure/`). Aucun registre à maintenir : l'ensemble des
catégories est reconstruit à chaque génération depuis les articles existants.

| `status` | Page générée | Dans l'index / RSS / sitemap |
|---|---|---|
| `published` | oui | oui |
| `unlisted` | oui (+ `noindex`) | non — accessible par URL seulement |
| `draft` | non (purgée si elle existait) | non |

## Markdown accepté

Titres `##` à `####`, **gras**, *italique*, `code`, blocs ``` ```lang ```,
listes à puces et numérotées (imbriquées par 2 espaces), citations `>`,
tableaux `|…|`, filets `---`, liens et images.

Le HTML brut dans le Markdown est **échappé**, jamais interprété, et les URL en
`javascript:` / `data:` sont neutralisées.

---

## Taxonomie & pages générées

| Page | Source | Indexable |
|---|---|---|
| `blog/index.html` | tous les articles listés + barre de filtres | oui |
| `blog/<slug>/` | un article | oui (sauf `unlisted`) |
| `blog/archives/` | sommaire année → mois | oui |
| `blog/archives/<AAAA>/` | une année | oui |
| `blog/archives/<AAAA>/<MM>/` | un mois | **noindex** (contenu trop mince) |
| `blog/categorie/` | sommaire des catégories | oui |
| `blog/categorie/<slug>/` | une catégorie | oui |

Toutes sont bâties sur le gabarit commun `render_collection()`, qui produit le
même rendu que l'index sans la barre de filtres.

**Régénération intégrale.** `blog/archives/` et `blog/categorie/` sont effacés
puis reconstruits à chaque passage (`purge_tree()`, qui ne supprime que les
fichiers portant la marque du générateur). Sans cela, une catégorie renommée ou
une année vidée laisserait une page orpheline toujours servie par nginx.

**Slugs réservés.** `SLUGS_RESERVES` plus tout slug de 4 chiffres : le script
échoue avec un message explicite plutôt que de produire deux pages en collision
sur la même URL.

**Filtres de l'index.** Entièrement côté client, sur le DOM déjà rendu : chaque
`<li>` porte `data-cat`, `data-tags`, `data-y` et `data-m`. L'état est recopié
dans l'URL (`?cat=&annee=&mois=&tag=&tri=`) et relu au chargement. La barre est
masquée si JavaScript est absent — les pages de catégorie et d'archives
assurent alors la navigation.

**`mtime` des pages de liste.** Contrairement aux articles, les pages de liste
gardent leur date de génération réelle : leur contenu change effectivement à
chaque publication, et un `mtime` antidaté ferait servir une version périmée aux
navigateurs qui les ont déjà en cache (`If-Modified-Since` → 304).

---

## Datation

Le champ `date` du front-matter est la **seule** source de vérité. Tout en
découle :

| Élément | Valeur utilisée |
|---|---|
| Affichage, tri de l'index, prev/next | `date` |
| `mtime` du HTML, du dossier et du `.md` source | `updated` ?? `date` |
| `<lastmod>` du sitemap | `updated` ?? `date` |
| `<pubDate>` du RSS | `date` |
| `datePublished` / `dateModified` (JSON-LD, OpenGraph) | `date` / `updated` |
| `data/blog.json` | `date` |

Deux conséquences :

- Un article peut porter **n'importe quelle date**, y compris antérieure : il se
  place à sa place chronologique et reste cohérent partout, en-têtes HTTP
  compris (`Last-Modified`, `ETag`, tous deux dérivés du `mtime` recalé). C'est
  ce qui permet de remettre en ligne d'anciennes archives avec leur date
  d'origine, comme le fait n'importe quel générateur statique lors d'une
  migration.
- Aucun identifiant séquentiel n'est émis : l'URL d'un article est son slug, et
  le champ `ref` est un jeton opaque tiré de `random_bytes()`. Les adresses ne
  dépendent donc pas de l'ordre de publication.

Si `date` ne comporte pas d'heure, le générateur en dérive une de façon stable à
partir du slug (entre 8h et 22h) plutôt que de retenir `00:00`.

### Images

Une image porte ses propres dates, indépendantes du front-matter :

```bash
exiftool -all= media/mon-visuel.jpg                # métadonnées EXIF
touch -d "2019-03-14 09:20" media/mon-visuel.jpg   # mtime du fichier
```

(`exiftool` n'est pas installé sur ce serveur — à faire depuis ton poste.)

## Sécurité

- `build-blog.php` et `new-post.php` : **garde CLI** (`PHP_SAPI !== 'cli'`) →
  injoignables via le web, comme `update-github-fafchamps.php`.
- Le vhost bloque `/_posts/` : seul le HTML généré de `/blog/` est servi.
- Aucun runtime PHP dans les pages publiées : du HTML statique, rien d'autre.
- Le générateur ne supprime que les dossiers de `blog/` portant sa propre
  marque — une page déposée à la main dans `blog/` est conservée (avertissement).

## Pas de cron

Contrairement à l'activité GitHub, rien n'est périodique ici : le script se
lance **à la demande**, après écriture ou modification d'un article.
