# _cron/ — Mise à jour de l'activité GitHub

Tout est contenu ici pour qu'une **migration de serveur = copier le dossier `fafchamps.be/`**.

## Fichiers
| Fichier | Rôle |
|---|---|
| `update-github-fafchamps.php` | Script (CLI uniquement) qui écrit `../data/github.json` |
| `secret.php` | Ton token GitHub : `<?php return 'ghp_...';` — **à créer, ne pas partager** |
| `secret.php.example` | Modèle à copier |

## Mise en route du token (recommandé, source 100% officielle)
1. Crée un PAT *classic* avec le seul scope **`read:user`** : https://github.com/settings/tokens
2. ```
   cd /var/www/sites/fafchamps.be/_cron
   cp secret.php.example secret.php
   nano secret.php          # colle le token
   chmod 600 secret.php
   ```
Sans token, le script utilise une source publique de secours (jogruber) — la page n'est jamais vide.

## Exécution manuelle (test)
```
docker exec shared-php php /var/www/fafchamps.be/_cron/update-github-fafchamps.php
```
(le chemin est celui **dans** le conteneur : `/var/www/sites` du host = `/var/www` dans `shared-php`)

## Cron (déjà installé, 1×/jour)
```
30 6 * * * docker exec shared-php php /var/www/fafchamps.be/_cron/update-github-fafchamps.php >> /var/www/sites/fafchamps.be/_cron/update-github.log 2>&1
```

## Sécurité
- Script et `secret.php` : **garde CLI** → injoignables / inertes via le web.
- nginx exécute les `.php` (PHP-FPM) → un téléchargement de `secret.php` renvoie un corps vide.
- Le vhost (`../deploy/fafchamps.be.conf`) bloque tout le dossier, sans sensibilité à la casse :
  ```nginx
  location ~* ^/(_cron|deploy)/ { deny all; }
  ```
  Si tu déploies avec une autre conf, reporte cette directive.
