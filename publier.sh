#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# publier.sh — raccourcis pour les publications de fafchamps.be
#
#   ./publier.sh nouveau "Mon titre" [AAAA-MM-JJ]   crée un brouillon
#   ./publier.sh liste                              liste les articles + statut
#   ./publier.sh publie                             (re)génère le site
#
# Mode d'emploi pas à pas : voir PUBLIER.md
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"

CT_PATH=/var/www/fafchamps.be          # le dossier du site, vu depuis shared-php

# -u : on exécute PHP sous l'identité de l'utilisateur courant de l'hôte.
# Sans ça, le conteneur écrit en root et les fichiers créés dans _posts/ ne
# seraient plus éditables (nano échouerait à enregistrer).
PHP=(docker exec -u "$(id -u):$(id -g)" shared-php php)

case "${1:-aide}" in

  nouveau|new|n)
    shift
    if [ $# -lt 1 ]; then
      echo "Usage: ./publier.sh nouveau \"Mon titre\" [AAAA-MM-JJ]" >&2
      exit 1
    fi
    "${PHP[@]}" "$CT_PATH/_cron/new-post.php" "$@"
    ;;

  liste|ls|l)
    shopt -s nullglob
    fichiers=(_posts/*.md)
    if [ ${#fichiers[@]} -eq 0 ]; then
      echo "Aucun article dans _posts/ — commence par : ./publier.sh nouveau \"Mon titre\""
      exit 0
    fi
    printf '%-18s %-11s %s\n' DATE STATUT TITRE
    printf '%-18s %-11s %s\n' '------------------' '-----------' '-----'
    for f in "${fichiers[@]}"; do
      d=$(sed -n 's/^date: *//p'   "$f" | head -1)
      s=$(sed -n 's/^status: *//p' "$f" | head -1)
      t=$(sed -n 's/^title: *//p'  "$f" | head -1 | sed 's/^"//; s/"$//')
      printf '%-18s %-11s %s\n' "${d:-?}" "${s:-published}" "$t"
    done
    echo
    echo "Fichiers dans _posts/ — pour publier un brouillon : mets status: published puis ./publier.sh publie"
    ;;

  publie|build|go|p)
    "${PHP[@]}" "$CT_PATH/_cron/build-blog.php"
    echo
    echo "En ligne : https://www.fafchamps.be/blog/"
    ;;

  aide|help|-h|--help|*)
    cat <<'AIDE'
publier.sh — publications de fafchamps.be

  ./publier.sh nouveau "Mon titre"              nouveau brouillon, daté d'aujourd'hui
  ./publier.sh nouveau "Mon titre" 2019-03-14   nouveau brouillon, daté du 14 mars 2019
  ./publier.sh liste                            que contient _posts/ et quel statut
  ./publier.sh publie                           régénère /blog/ et met le site à jour

Le détail pas à pas est dans PUBLIER.md.
AIDE
    ;;
esac
