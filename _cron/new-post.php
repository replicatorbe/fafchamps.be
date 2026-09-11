<?php
/**
 * new-post.php — crée le squelette d'une publication dans _posts/
 * ---------------------------------------------------------------------------
 * Usage :
 *   php new-post.php "Titre de l'article" [date]
 *
 *   date : « 2019-03-14 », « 2019-03-14 09:20 », « hier », « -3 days »…
 *          (tout ce que comprend DateTimeImmutable). Par défaut : maintenant.
 *
 * Exemples :
 *   php new-post.php "Durcir nginx sans casser le TLS" 2019-03-14
 *   php new-post.php "Retour sur un CTF forensic"
 *
 * L'article est créé en `status: draft` : il n'apparaît nulle part tant que tu
 * ne l'as pas passé en `published` puis relancé build-blog.php.
 *
 * Le champ `ref` est un jeton court tiré de random_bytes() : pratique pour
 * référencer un article à l'oral ou dans une note, et opaque — il ne dépend
 * d'aucun compteur ni d'aucun horodatage.
 * ---------------------------------------------------------------------------
 */

if (PHP_SAPI !== 'cli') {            // garde : jamais exécutable via le web
    http_response_code(403);
    exit;
}

date_default_timezone_set('Europe/Brussels');
mb_internal_encoding('UTF-8');

require_once __DIR__ . '/lib-slug.php';

$argv = $_SERVER['argv'];
$title = trim($argv[1] ?? '');
if ($title === '') {
    fwrite(STDERR, "Usage: php new-post.php \"Titre de l'article\" [date]\n");
    exit(1);
}

$when = trim($argv[2] ?? '');
try {
    $date = new DateTimeImmutable($when === '' ? 'now' : $when, new DateTimeZone('Europe/Brussels'));
} catch (Exception $e) {
    fwrite(STDERR, "ERREUR: date incomprise : « {$when} »\n");
    exit(1);
}

/* Une date fournie sans heure est écrite SANS heure : build-blog.php en dérivera
   alors une, plausible et stable, à partir du slug. Écrire « 00:00 » alignerait
   au contraire tous les articles sur la même heure ronde. */
$avecHeure  = $when === '' || preg_match('/\d{1,2}:\d{2}/', $when) === 1;
$dateLigne  = $avecHeure ? $date->format('Y-m-d H:i') : $date->format('Y-m-d');

$slug = slugify($title);
if ($slug === '') {
    fwrite(STDERR, "ERREUR: impossible de dériver un slug de ce titre.\n");
    exit(1);
}

/* Jeton court aléatoire : 8 caractères en base32 (alphabet sans ambiguïté). */
function make_ref(int $len = 8): string {
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';   // ni 0/o, ni 1/l/i
    $out = '';
    $bytes = random_bytes($len);
    for ($i = 0; $i < $len; $i++) {
        $out .= $alphabet[ord($bytes[$i]) % strlen($alphabet)];
    }
    return $out;
}

$dir  = dirname(__DIR__) . '/_posts';
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
    fwrite(STDERR, "ERREUR: impossible de créer {$dir}\n");
    exit(1);
}

$file = $dir . '/' . $date->format('Y-m-d') . '-' . $slug . '.md';
if (file_exists($file)) {
    fwrite(STDERR, "ERREUR: existe déjà : {$file}\n");
    exit(1);
}

$ref = make_ref();

$fm = <<<MD
---
title:    "{$title}"
date:     {$dateLigne}
slug:     {$slug}
ref:      {$ref}
category: ""
tags:     []
summary:  ""
status:   draft
# category : UNE rubrique (Infrastructure, Sûreté, Forensic…) ; vide -> « Divers »
# tags     : autant qu'on veut, en minuscules — ex. tags: [nginx, tls]
# status   : draft (invisible) | published (public) | unlisted (hors listes)
---

Premier paragraphe : il sert de résumé si `summary` reste vide.

## Un intitulé de section

Texte, `code en ligne`, **gras**, *italique*, [un lien](https://example.org).

```bash
# un bloc de code
echo "bonjour"
```

- un point
- un autre
  - imbriqué

> Une citation.

| Colonne | Valeur |
|---|---|
| a | 1 |

MD;

if (@file_put_contents($file, $fm) === false) {
    fwrite(STDERR, "ERREUR: écriture impossible : {$file}\n");
    exit(1);
}
@touch($file, $date->getTimestamp());

$court = '_posts/' . basename($file);
echo "créé : {$court}\n";
echo "\nÉtapes suivantes :\n";
echo "  1. écris l'article      nano {$court}\n";
echo "  2. rends-le public      dans ce fichier : status: draft  ->  status: published\n";
echo "  3. mets le site à jour  ./publier.sh publie\n";
