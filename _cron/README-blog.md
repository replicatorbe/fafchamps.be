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
docker exec shared-php php /var/www/fafchamps.be/_cron/new-post.php \
        "Durcir nginx sans casser le TLS" 2019-03-14

# 2. écrire
nano _posts/2019-03-14-durcir-nginx-sans-casser-le-tls.md

# 3. passer status: draft -> published, puis générer
docker exec shared-php php /var/www/fafchamps.be/_cron/build-blog.php
```

C'est tout : `blog/index.html`, `blog/<slug>/index.html`, `blog/feed.xml`,
`sitemap.xml` et `data/blog.json` sont réécrits à chaque passage.

## Front-matter

```yaml
---
title:   "Titre de l'article"     # obligatoire
date:    2019-03-14 09:20         # obligatoire (heure facultative)
slug:    durcir-nginx             # facultatif — déduit du titre/nom de fichier
ref:     k7m2q9xd                 # facultatif — jeton aléatoire, aucun ordre
updated: 2020-01-08               # facultatif — affiché « mis à jour le … »
tags:    [nginx, tls]             # facultatif
summary: "…"                      # facultatif — sinon 1er paragraphe tronqué
status:  published                # published | draft | unlisted
---
```

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
