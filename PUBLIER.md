# Publier un article sur fafchamps.be

Note pour moi-même. À relire sans rien avoir retenu.

---

## Le principe en trois phrases

1. Un article = **un fichier texte** dans `_posts/`, écrit en Markdown.
2. Une commande transforme ces fichiers en pages HTML dans `blog/`.
3. Le site est **déjà en ligne** : dès que la commande est passée, c'est public.

Il n'y a pas de mot de passe, pas d'interface web, pas de base de données.
Tout se fait dans le terminal, depuis `/var/www/sites/fafchamps.be`.

```bash
cd /var/www/sites/fafchamps.be
```

**Toutes les commandes de cette note supposent que tu es dans ce dossier.**

---

## Publier un article — la recette complète

### Étape 1 — créer le fichier

```bash
./publier.sh nouveau "Durcir nginx sans casser le TLS"
```

Le script répond :

```
créé : _posts/2026-09-11-durcir-nginx-sans-casser-le-tls.md

Étapes suivantes :
  1. écris l'article      nano _posts/2026-09-11-durcir-nginx-sans-casser-le-tls.md
  2. rends-le public      dans ce fichier : status: draft  ->  status: published
  3. mets le site à jour  ./publier.sh publie
```

### Étape 2 — écrire

```bash
nano _posts/2026-09-11-durcir-nginx-sans-casser-le-tls.md
```

Tu trouves un fichier pré-rempli. Le bloc entre les deux `---` en haut, c'est la
fiche signalétique de l'article ; **en dessous**, c'est le texte.

```
---
title:    "Durcir nginx sans casser le TLS"
date:     2026-09-11 14:30
slug:     durcir-nginx-sans-casser-le-tls
ref:      k7m2q9xd
category: ""
tags:     []
summary:  ""
status:   draft
---

Ici, ton texte.
```

Ce que tu touches, en pratique :

| Ligne | À quoi ça sert | Tu y touches ? |
|---|---|---|
| `title` | le titre affiché | oui |
| `date` | **la date affichée** (voir plus bas) | oui |
| `slug` | l'adresse de la page : `fafchamps.be/blog/<slug>/` | rarement |
| `ref` | code court aléatoire, juste une référence interne | non |
| `category` | **la** rubrique de l'article : `category: Infrastructure` | oui |
| `tags` | mots-clés : `tags: [nginx, tls]` | oui |
| `summary` | le résumé sous le titre. Vide = premier paragraphe | oui, c'est mieux |
| `status` | `draft` (invisible) ou `published` (public) | **oui, à la fin** |

### Étape 3 — rendre public

Dans le fichier, remplace :

```
status:  draft
```

par :

```
status:  published
```

Rien d'autre à changer.

### Étape 4 — mettre le site à jour

```bash
./publier.sh publie
```

```
[2026-09-11 21:02:14]   · 2026-09-11  durcir-nginx-sans-casser-le-tls
[2026-09-11 21:02:14] terminé : 1 publiée(s) · 0 non listée(s) · 0 brouillon(s)

En ligne : https://www.fafchamps.be/blog/
```

**C'est fini.** L'article est visible sur <https://www.fafchamps.be/blog/>, dans le
flux RSS, dans le sitemap, et dans l'aperçu de la page d'accueil.

> Tant que tu n'as pas lancé `./publier.sh publie`, **rien ne change sur le site**.
> C'est cette commande, et elle seule, qui met en ligne.

---

## Remettre en ligne une archive (article daté du passé)

C'est le cas prévu dès la conception : reprendre un contenu d'un ancien backup ou
d'une version précédente du site, et le republier **avec sa date d'origine**.
Il suffit de donner la date à la création :

```bash
./publier.sh nouveau "Durcir nginx sans casser le TLS" 2019-03-14
```

Puis exactement les mêmes étapes 2, 3, 4. L'article se place tout seul à sa
place chronologique dans la liste.

Tu peux aussi changer la ligne `date:` d'un article existant, puis relancer
`./publier.sh publie` : tout se réaligne.

### Ce que la date pilote

La date que tu inscris est la **seule** source de vérité. Tout en découle :

- la position de l'article dans la liste et dans le flux RSS ;
- le `<lastmod>` du sitemap et les données structurées lues par Google ;
- **la date du fichier sur le serveur** — un navigateur qui demande « quand ce
  fichier a-t-il changé ? » reçoit *14 mars 2019*, pas la date du jour.

Le site est donc cohérent de bout en bout, quelle que soit la date choisie :
c'est le comportement normal d'un générateur statique quand on migre
d'anciens contenus.

Deux détails au passage :

- **Pas de numéro d'article.** L'adresse d'une page, c'est son titre
  (`/blog/durcir-nginx/`), jamais `?id=7`. Les adresses ne dépendent donc pas de
  l'ordre dans lequel tu publies.
- **L'heure**, si tu ne la précises pas, est dérivée du titre de façon stable
  (entre 8h et 22h), plutôt que de mettre « 00:00 » sur tout le monde.

Le relevé complet de tous les endroits où une date apparaît — utile quand tu
remets un gros lot d'archives en ligne — est dans `DATATION.md`.

## Ranger et retrouver ses articles

### Catégorie ou tag ?

- **`category`** : **une seule** par article. C'est le grand rayonnage, celui qui
  structure la navigation. Écris-la comme tu veux l'afficher :
  `category: Infrastructure`, `category: Sûreté`, `category: Forensic`.
  L'adresse de la page est dérivée automatiquement :
  `/blog/categorie/infrastructure/`.
- **`tags`** : autant que tu veux, en minuscules, pour le détail :
  `tags: [nginx, tls, hardening]`.

Si tu ne mets pas de `category`, l'article part dans **Divers**. Pas de liste de
catégories à tenir à jour quelque part : écris simplement le nom, la catégorie
est créée ; le dernier article qui la quitte la fait disparaître.

> Un conseil : garde peu de catégories (4 ou 5), sinon le rangement ne sert plus
> à rien. Les tags sont là pour la finesse.

### Les trois vues, créées automatiquement

| Page | Contenu |
|---|---|
| `/blog/` | tous les articles, avec la barre de filtres |
| `/blog/archives/` | tout le classement par année puis par mois |
| `/blog/archives/2019/` et `/blog/archives/2019/03/` | une année, un mois |
| `/blog/categorie/` | toutes les catégories avec leur nombre d'articles |
| `/blog/categorie/infrastructure/` | une catégorie |

Tu n'as **rien à créer** : ces pages apparaissent, se mettent à jour et
disparaissent toutes seules à chaque `./publier.sh publie`.

### Trier et filtrer depuis /blog/

En haut de la liste, quatre menus déroulants et un tri :

```
[ Catégorie ▾ ]  [ Année ▾ ]  [ Mois ▾ ]  [ Tag ▾ ]   Tri : [plus récent][plus ancien]
```

Les filtres se **combinent** (« Infrastructure » + « 2019 » + « mars »), le menu
des mois ne propose que les mois où tu as effectivement publié, et le tri
bascule du plus récent au plus ancien.

L'état se recopie dans l'adresse, donc **un filtre est partageable** :

```
https://www.fafchamps.be/blog/?cat=infrastructure&annee=2019&tri=asc
```

Tout se passe dans le navigateur : aucun rechargement de page.

### Un nom de slug interdit

`archives`, `categorie`, `tag`, `page`, `feed`, `index`, `assets`, `media`,
`img` et les nombres à 4 chiffres (`2019`) sont réservés à la navigation. Si tu
en utilises un, la génération s'arrête avec un message explicite — il suffit de
changer la ligne `slug:`.

---

## Les autres opérations

### Voir où j'en suis

```bash
./publier.sh liste
```

```
DATE               STATUT      TITRE
------------------ ----------- -----
2019-03-14 09:20   draft       Durcir nginx sans casser le TLS
2026-09-11 18:40   published   Un espace pour écrire
```

### Corriger un article déjà publié

Modifie le fichier dans `_posts/`, puis :

```bash
./publier.sh publie
```

Si la correction est importante et que tu veux l'afficher, ajoute une ligne dans
le bloc du haut :

```
updated: 2026-10-02
```

La page affichera alors « mis à jour le 2 octobre 2026 » sous le titre.

### Retirer un article du site

Repasse-le en `status:  draft`, puis `./publier.sh publie`. La page est
supprimée du site, mais **le fichier reste** dans `_posts/` : rien n'est perdu.

Pour supprimer définitivement : `rm _posts/le-fichier.md` puis
`./publier.sh publie`.

### Garder un article accessible sans le lister

`status:  unlisted` : la page existe et fonctionne si on a l'adresse, mais elle
n'apparaît ni dans la liste, ni dans le RSS, ni dans le sitemap, et demande aux
moteurs de ne pas l'indexer. Pratique pour envoyer un brouillon à quelqu'un.

---

## Comment on écrit le texte (Markdown)

~~~markdown
## Un titre de section
### Un sous-titre

Du texte normal, avec du **gras**, de l'*italique* et du `code` au milieu.

- une liste
- un autre point
  - un point imbriqué (deux espaces devant)

1. une liste numérotée
2. deuxième

> Une citation, qui s'affiche en encadré.

[Un lien](https://exemple.be) — les liens externes reçoivent une flèche ↗ tout seuls.

```bash
# un bloc de code, avec le nom du langage après les trois accents graves
echo "bonjour"
```

| Colonne | Valeur |
|---|---|
| a | 1 |

---
~~~

Ce dernier `---` (sur sa propre ligne, dans le texte) trace un filet horizontal.

### Ajouter une image

Mets le fichier dans `media/` (crée le dossier s'il n'existe pas) :

```bash
mkdir -p media
cp ~/ma-capture.png media/
```

Puis dans l'article :

```markdown
![Description de l'image](/media/ma-capture.png)
![Avec légende](/media/ma-capture.png "La légende affichée dessous")
```

⚠️ Une image porte **ses propres dates**, indépendantes de celle de l'article :
ses métadonnées EXIF (date de prise de vue) et la date du fichier. Pour une
archive, recale les deux depuis ton poste avant de copier :

```bash
exiftool -all= ma-capture.png                    # efface les métadonnées
touch -d "2019-03-14 09:20" ma-capture.png       # recale la date du fichier
```

(`exiftool` n'est pas installé sur le serveur.)

---

## Les quatre choses à ne pas faire

1. **Ne modifie jamais un fichier dans `blog/`.** Ce dossier est entièrement
   réécrit à chaque `./publier.sh publie` : ton travail serait perdu. On n'édite
   que `_posts/`.
2. **Ne compte pas sur GitHub pour sauvegarder tes articles.** `_posts/` en est
   volontairement exclu (c'est ce qui protège les dates). **Fais-en une copie
   ailleurs** — clé USB, dépôt privé, ou :
   ```bash
   tar czf ~/posts-$(date +%F).tar.gz _posts/
   ```
3. **N'oublie pas l'étape 4.** Un article écrit et passé en `published` mais sans
   `./publier.sh publie` n'existe pas sur le site.
4. **Ne mets pas deux articles avec le même `slug`.** Le script s'arrête avec une
   erreur explicite — change simplement le `slug` de l'un des deux.

---

## Si ça ne marche pas

| Symptôme | Cause la plus probable | Solution |
|---|---|---|
| `terminé : 0 publiée(s)` | tous les articles sont encore en `draft` | passe-en un en `published` |
| « titre manquant, ignoré » | la ligne `title:` est vide ou a perdu ses guillemets | `title:   "Mon titre"` |
| « date invalide » | format exotique | écris `date:    2019-03-14` ou `2019-03-14 09:20` |
| « slug en doublon » | deux fichiers visent la même adresse | change la ligne `slug:` de l'un |
| L'article n'apparaît pas | l'étape 4 a été oubliée | `./publier.sh publie` |
| La mise en page est cassée | la feuille de style a été touchée | `git checkout assets/blog.css` |
| `Cannot connect to the Docker daemon` | Docker est arrêté | `sudo systemctl start docker` |
| `Permission denied` en enregistrant dans nano | le fichier appartient à `root` (script lancé sans `publier.sh`) | `sudo chown -R $(id -un): _posts blog` puis repasser par `./publier.sh` |
| `AVERTISSEMENT: l'empreinte CSP du script inline ne correspond plus` | le script du blog a été modifié dans `_cron/build-blog.php` | colle l'empreinte affichée dans `deploy/security-headers.inc`, copie le fichier dans `/var/www/nginx/conf.d/`, puis `docker exec all-sites-nginx nginx -t && docker exec all-sites-nginx nginx -s reload` |
| Le mode lecture ne répond plus sur le blog | l'empreinte CSP ne correspond plus (message ci-dessus ignoré) | même correctif ; la console du navigateur affiche « Refused to execute inline script » |

Fonctionnement interne du générateur : [`_cron/README-blog.md`](_cron/README-blog.md).
Relevé de tous les endroits où une date apparaît : `DATATION.md`.

---

## Aide-mémoire

```bash
cd /var/www/sites/fafchamps.be

./publier.sh nouveau "Mon titre"              # brouillon daté d'aujourd'hui
./publier.sh nouveau "Mon titre" 2019-03-14   # brouillon daté du 14 mars 2019
./publier.sh liste                            # où j'en suis
./publier.sh publie                           # mise en ligne

nano _posts/<le-fichier>.md                   # écrire  (status: draft -> published)
```

<https://www.fafchamps.be/blog/>
