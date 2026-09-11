# fafchamps.be

Site personnel de **Jérôme Fafchamps** ([@replicatorbe](https://github.com/replicatorbe)) —
page unique statique, thème « terminal », avec une section **Activité GitHub** alimentée
une fois par jour par un script PHP en CLI, et un espace **Publications** généré
à la demande depuis des fichiers Markdown.

🌐 <https://www.fafchamps.be>

---

## Contenu du dépôt

| Chemin | Rôle |
|---|---|
| `index.html` | La page d'accueil (HTML/CSS/JS inline, aucune dépendance de build) |
| `assets/blog.css` | Feuille de style des pages de publications |
| `img/` | Visuels des projets |
| `_cron/` | Scripts CLI : activité GitHub ([README](_cron/README.md)) et générateur du blog ([README-blog](_cron/README-blog.md)) |
| `_posts/` | **Hors dépôt** — sources Markdown des publications |
| `blog/` | **Hors dépôt** — HTML généré des publications |
| `data/` | Sortie générée : `github.json`, `blog.json` (ignorés par git) |
| `robots.txt` | Indexation + emplacement du sitemap |
| `deploy/` | Configuration nginx du vhost |

Le site n'a **aucune étape de build** : le déployer = copier le dossier.

---

## Déploiement

Le serveur fait tourner une stack Docker mutualisée (nginx unique + PHP-FPM + MySQL partagés).

1. Copier le dossier dans la racine des sites :
   ```bash
   cp -r fafchamps.be /var/www/sites/
   ```
2. Installer le vhost et recharger nginx :
   ```bash
   cp /var/www/sites/fafchamps.be/deploy/fafchamps.be.conf /var/www/nginx/conf.d/
   docker exec all-sites-nginx nginx -s reload
   ```
3. Ajouter le domaine aux variables `VIRTUAL_HOST` / `LETSENCRYPT_HOST` du service `nginx-all`
   dans `/var/www/docker-compose.yml`, puis **recréer** le conteneur :
   ```bash
   cd /var/www && docker compose up -d nginx-all
   ```
   > ⚠️ `docker compose restart` ne recharge **pas** les variables d'environnement — il faut `up -d`.

---

## Publications (blog)

Des fichiers Markdown dans `_posts/`, un script PHP en CLI, du HTML statique dans `blog/`.

```bash
# créer un article (la date est libre — y compris ancienne)
./publier.sh nouveau "Mon titre" 2019-03-14
# l'écrire, passer status: draft -> published, puis générer
./publier.sh publie
```

`publier.sh` enrobe `docker exec -u "$(id -u):$(id -g)" shared-php php …` :
l'option `-u` est nécessaire pour que les fichiers créés restent éditables
depuis l'hôte au lieu d'appartenir à `root`.

Le générateur écrit `blog/index.html`, `blog/<slug>/index.html`, `blog/feed.xml`,
`sitemap.xml` et `data/blog.json` (lu par le teaser de la page d'accueil et par la
commande `blog` du terminal interactif).

`_posts/` et `blog/` sont **hors du dépôt** : celui-ci porte le code du site, pas
le contenu rédactionnel ni sa sortie générée. **Ils ne sont donc pas sauvegardés
par git** — prévoir un dépôt privé ou un backup.

La date inscrite dans le front-matter est la seule source de vérité : affichage,
tri, `mtime` du fichier, RSS, sitemap et JSON-LD en découlent tous. Un article
peut donc porter n'importe quelle date sans que le site se contredise.

Front-matter, Markdown accepté et détails du générateur :
[`_cron/README-blog.md`](_cron/README-blog.md).

---

## Activité GitHub (cron)

Le script écrit `data/github.json`, lu par `index.html` en `fetch()`.
Si le fichier est absent ou illisible, la page affiche un lien de repli vers GitHub — rien ne casse.

**Exécution manuelle :**
```bash
docker exec shared-php php /var/www/fafchamps.be/_cron/update-github-fafchamps.php
```
(chemin **dans** le conteneur : `/var/www/sites` du host = `/var/www` dans `shared-php`)

**Cron installé, 1×/jour à 06:30 UTC** — soit 08:30 à Bruxelles en heure d'été, 07:30 en heure
d'hiver. Le serveur est en UTC ; le script force `Europe/Brussels` pour l'horodatage du log,
d'où l'écart apparent entre la ligne de cron et les timestamps.
```cron
30 6 * * * docker exec shared-php php /var/www/fafchamps.be/_cron/update-github-fafchamps.php >> /var/www/sites/fafchamps.be/_cron/update-github.log 2>&1
```

**Token (optionnel).** Sans token, le script utilise une source publique de secours et la page
n'est jamais vide. Avec un PAT *classic* limité au scope `read:user`, les données viennent à 100 %
de l'API officielle GitHub. Voir [`_cron/README.md`](_cron/README.md) — le token vit dans
`_cron/secret.php`, **ignoré par git**.

---

## Sécurité

- `_cron/` et `deploy/` sont refusés par le vhost, sans sensibilité à la casse :
  ```nginx
  location ~* ^/(_cron|deploy)/ { deny all; }
  location ~* ^/README\.md$    { deny all; }
  ```
  Le script porte en plus une garde `PHP_SAPI !== 'cli'` : il est injoignable via le web.
- Le vhost bloque également `.git`, `.env` et `.ht*`.
- Aucun secret n'est versionné : `_cron/secret.php` est dans le `.gitignore`.

---

## Licence

Le **code** (HTML, CSS, JavaScript, PHP, configuration nginx) est publié sous licence MIT —
voir [`LICENSE`](LICENSE).

**Exclus de la licence MIT, tous droits réservés :**

- le **contenu rédactionnel** (textes de présentation, parcours, réalisations) ;
- les **images** du dossier `img/`. Ces captures d'archives reproduisent des interfaces et des
  créations graphiques et publicitaires appartenant à des tiers (notamment « © 2007 Chat.fr »)
  et sont montrées à titre d'illustration historique. Elles ne peuvent être réutilisées,
  redistribuées ni modifiées. Les zones comportant des données personnelles de tiers
  (photos de membres, pseudonymes) ont été neutralisées de façon irréversible.
