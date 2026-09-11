<?php
/**
 * build-blog.php — générateur statique des PUBLICATIONS de fafchamps.be
 * ---------------------------------------------------------------------------
 * Lit  : _posts/*.md          (Markdown + front-matter, HORS dépôt public)
 * Écrit: blog/index.html
 *        blog/<slug>/index.html
 *        blog/feed.xml
 *        sitemap.xml          (racine : accueil + index blog + articles)
 *        data/blog.json       (teaser « Publications » sur la page d'accueil)
 *
 * PRINCIPE DE DATATION
 *   Le champ `date` du front-matter est la SEULE source de vérité : affichage,
 *   tri, JSON-LD, RSS, sitemap et mtime des fichiers générés en découlent tous.
 *   Un article peut donc porter n'importe quelle date et rester cohérent
 *   partout, en-têtes HTTP compris. Cf. _cron/README-blog.md § « Datation ».
 *
 *   Aucun identifiant séquentiel n'est émis : l'URL d'un article est son slug,
 *   et le champ optionnel `ref` est un jeton opaque tiré de random_bytes().
 *
 * SÉCURITÉ
 *   - CLI uniquement (garde ci-dessous) : indéclenchable via le web.
 *   - Aucun HTML brut n'est accepté dans le Markdown : tout est échappé.
 *
 * Exécution :
 *   docker exec shared-php php /var/www/fafchamps.be/_cron/build-blog.php
 *   options : --quiet  (silencieux sauf erreurs)
 * ---------------------------------------------------------------------------
 */

if (PHP_SAPI !== 'cli') {            // garde : jamais exécutable via le web
    http_response_code(403);
    exit;
}

date_default_timezone_set('Europe/Brussels');
mb_internal_encoding('UTF-8');

/* ============================== CONFIG ================================== */

const SITE_URL   = 'https://www.fafchamps.be';
const SITE_NAME  = 'Jérôme Fafchamps';
const AUTHOR     = 'Jérôme Fafchamps';
const AUTHOR_URL = SITE_URL . '/';
const EMAIL      = 'jerome@fafchamps.be';
const BLOG_TITLE = 'Publications';
const BLOG_DESC  = "Notes techniques, retours d'expérience et analyses — infrastructure, réseau, "
                 . 'DevOps, sûreté et cybersécurité. Par Jérôme Fafchamps.';
const TEASER_N   = 4;        // nb d'articles poussés dans data/blog.json
const WPM        = 200;      // mots/minute pour le temps de lecture
const MARKER     = '<!-- généré par _cron/build-blog.php — ne pas éditer à la main -->';

$ROOT     = dirname(__DIR__);
$SRC_DIR  = $ROOT . '/_posts';
$OUT_DIR  = $ROOT . '/blog';
$JSON_OUT = $ROOT . '/data/blog.json';
$MAP_OUT  = $ROOT . '/sitemap.xml';

$QUIET = in_array('--quiet', $argv, true);

/* Le vhost sert les .css avec « expires 1y; immutable » : sans empreinte dans
   l'URL, une retouche de la feuille de style ne parviendrait jamais aux
   visiteurs déjà venus. */
$CSS_FILE = $ROOT . '/assets/blog.css';
define('CSS_VER', is_file($CSS_FILE) ? substr(md5_file($CSS_FILE), 0, 10) : '0');

/* ============================== HELPERS ================================= */

function logmsg(string $m): void {
    global $QUIET;
    if (!$QUIET) fwrite(STDOUT, '[' . date('Y-m-d H:i:s') . '] ' . $m . "\n");
}
function warn(string $m): void {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] AVERTISSEMENT: ' . $m . "\n");
}
function fail(string $m): never {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] ERREUR: ' . $m . "\n");
    exit(1);
}
function e(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

/* slugify() est partagée avec new-post.php (même URL dérivée d'un même titre). */
require_once __DIR__ . '/lib-slug.php';

/** Mois en français, sans dépendre de la locale du conteneur. */
const MOIS = [1=>'janvier','février','mars','avril','mai','juin',
              'juillet','août','septembre','octobre','novembre','décembre'];
function date_fr(DateTimeImmutable $d): string {
    return $d->format('j') . ' ' . MOIS[(int)$d->format('n')] . ' ' . $d->format('Y');
}

/**
 * URL autorisée dans le Markdown : http(s), mailto, ou relative.
 * Reçoit une chaîne DÉJÀ échappée ; bloque javascript:, data:, etc.
 */
function safe_url(string $u): string {
    $u = trim($u);
    if ($u === '') return '#';
    if (preg_match('~^(https?://|mailto:|/|\#|\./|\.\./)~i', $u)) return $u;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $u)) return '#';   // tout autre schéma
    return $u;                                                   // relative simple
}

/* ======================== FRONT-MATTER (YAML light) ===================== */

/**
 * Sous-ensemble de YAML volontairement minimal : `clé: valeur`,
 * valeurs entre quotes, et listes en ligne `[a, b, c]`.
 * @return array{0:array<string,mixed>,1:string} [meta, corps]
 */
function parse_front_matter(string $raw): array {
    $raw = str_replace(["\r\n", "\r"], "\n", $raw);
    if (!preg_match('/^---\n(.*?)\n---\n?(.*)$/s', $raw, $m)) {
        return [[], $raw];
    }
    $meta = [];
    foreach (explode("\n", $m[1]) as $line) {
        if (trim($line) === '' || str_starts_with(ltrim($line), '#')) continue;
        if (!preg_match('/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/', $line, $kv)) continue;
        $key = strtolower($kv[1]);
        $val = trim($kv[2]);
        if ($val !== '' && ($val[0] === '"' || $val[0] === "'")
            && str_ends_with($val, $val[0]) && strlen($val) > 1) {
            $val = substr($val, 1, -1);
        } elseif (str_starts_with($val, '[') && str_ends_with($val, ']')) {
            $items = array_filter(array_map(
                fn($x) => trim(trim($x), "\"'"),
                explode(',', substr($val, 1, -1))
            ), fn($x) => $x !== '');
            $meta[$key] = array_values($items);
            continue;
        }
        $meta[$key] = $val;
    }
    return [$meta, $m[2]];
}

/* ============================== MARKDOWN ================================ */

/** Rendu des éléments en ligne. Tout est échappé : pas de HTML brut. */
function md_inline(string $s): string {
    $codes = [];
    $tags  = [];

    // 1. sanctuariser le code en ligne avant tout traitement
    $s = preg_replace_callback('/`([^`\n]+)`/', function ($m) use (&$codes) {
        $codes[] = $m[1];
        return "\x1AC" . (count($codes) - 1) . "\x1A";
    }, $s) ?? $s;

    // 2. échappement (une seule fois : les sorties ci-dessous ne re-échappent pas)
    $s = htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

    // 3. images, puis liens — chaque balise produite est mise à l'abri
    $s = preg_replace_callback(
        '/!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+&quot;([^&]*)&quot;)?\)/',
        function ($m) use (&$tags) {
            $cap = $m[3] ?? '';
            $img = '<img src="' . safe_url($m[2]) . '" alt="' . $m[1] . '" loading="lazy" decoding="async">';
            $tags[] = $cap !== ''
                ? '<figure>' . $img . '<figcaption>' . $cap . '</figcaption></figure>'
                : $img;
            return "\x1AT" . (count($tags) - 1) . "\x1A";
        }, $s) ?? $s;

    $s = preg_replace_callback('/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/', function ($m) use (&$tags) {
        $url  = safe_url($m[2]);
        $ext  = preg_match('~^https?://~i', $url) && !str_contains($url, 'fafchamps.be');
        $tags[] = '<a href="' . $url . '"' . ($ext ? ' target="_blank" rel="noopener"' : '') . '>'
                . $m[1] . ($ext ? ' ↗' : '') . '</a>';
        return "\x1AT" . (count($tags) - 1) . "\x1A";
    }, $s) ?? $s;

    // 4. emphase
    $s = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $s) ?? $s;
    $s = preg_replace('/(?<![\w*])\*([^*\n]+)\*(?![\w*])/', '<em>$1</em>', $s) ?? $s;
    $s = preg_replace('/(?<![\w_])_([^_\n]+)_(?![\w_])/', '<em>$1</em>', $s) ?? $s;

    // 5. liens nus restants (les balises déjà créées sont hors d'atteinte)
    $s = preg_replace_callback('~(?<![\w/])(https?://[^\s<]+?)(?=[.,;:!?)\]]*(?:\s|$))~',
        fn($m) => '<a href="' . safe_url($m[1]) . '" target="_blank" rel="noopener">'
                . preg_replace('~^https?://(www\.)?~', '', $m[1]) . ' ↗</a>', $s) ?? $s;

    // 6. restitution
    $s = preg_replace_callback('/\x1AT(\d+)\x1A/', fn($m) => $tags[(int)$m[1]], $s) ?? $s;
    $s = preg_replace_callback('/\x1AC(\d+)\x1A/',
        fn($m) => '<code>' . htmlspecialchars($codes[(int)$m[1]], ENT_QUOTES, 'UTF-8') . '</code>', $s) ?? $s;

    // 7. retours à la ligne forcés (deux espaces ou \ en fin de ligne)
    return preg_replace('/(?: {2,}|\\\\)\n/', "<br>\n", $s) ?? $s;
}

/** Détecte un début d'item de liste : [indent, ordonnée, texte]. */
function list_item(string $line): ?array {
    if (preg_match('/^(\s*)([-*+])\s+(.*)$/', $line, $m)) {
        return [strlen($m[1]), false, $m[3]];
    }
    if (preg_match('/^(\s*)(\d+)[.)]\s+(.*)$/', $line, $m)) {
        return [strlen($m[1]), true, $m[3]];
    }
    return null;
}

/** Rend une liste (imbrication gérée par l'indentation, pas de profondeur max). */
function render_list(array $items, int $i, int $level, string &$out): int {
    $ordered = $items[$i][1];
    $out .= $ordered ? "<ol>\n" : "<ul>\n";
    $n = count($items);
    while ($i < $n) {
        [$ind, $ord, $txt] = $items[$i];
        $lv = intdiv($ind, 2);
        if ($lv < $level || ($lv === $level && $ord !== $ordered)) break;
        if ($lv > $level) {                     // sous-liste
            $out = rtrim($out, "\n");
            $out = preg_replace('~</li>$~', '', $out) ?? $out;   // rouvrir le dernier item
            $i = render_list($items, $i, $lv, $out);
            $out .= "</li>\n";
            continue;
        }
        $out .= '<li>' . md_inline($txt) . "</li>\n";
        $i++;
    }
    $out .= $ordered ? "</ol>\n" : "</ul>\n";
    return $i;
}

/** Markdown → HTML. Sous-ensemble suffisant pour des notes techniques. */
function md_to_html(string $md): string {
    // on purge les octets de contrôle servant de marqueurs : la source ne doit
    // pas pouvoir se faire passer pour un bloc déjà extrait
    $md = str_replace(["\x00", "\x1A"], '', $md);
    $md = str_replace(["\r\n", "\r"], "\n", $md);

    // blocs de code clôturés : extraits avant toute autre analyse
    $fences = [];
    $md = preg_replace_callback('/^```[ \t]*([\w+#.-]*)[ \t]*\n(.*?)\n?^```[ \t]*$/ms',
        function ($m) use (&$fences) {
            $fences[] = [$m[1], $m[2]];
            return "\x1AF" . (count($fences) - 1) . "\x1A";
        }, $md) ?? $md;

    $lines = explode("\n", $md);
    $n = count($lines);
    $out = '';
    $i = 0;

    while ($i < $n) {
        $line = $lines[$i];
        $trim = trim($line);

        if ($trim === '') { $i++; continue; }

        // bloc de code
        if (preg_match('/^\x1AF(\d+)\x1A$/', $trim, $m)) {
            [$lang, $code] = $fences[(int)$m[1]];
            $out .= '<pre><code' . ($lang !== '' ? ' class="lang-' . e($lang) . '"' : '') . '>'
                  . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') . "</code></pre>\n";
            $i++; continue;
        }

        // titre
        if (preg_match('/^(#{2,4})\s+(.+?)\s*#*$/', $trim, $m)) {
            $lvl = strlen($m[1]);
            $txt = md_inline($m[2]);
            // le texte est déjà échappé : on le décode pour que l'ancre reste lisible
            $id  = slugify(html_entity_decode(strip_tags($txt), ENT_QUOTES, 'UTF-8'));
            $out .= "<h{$lvl}" . ($id !== '' ? ' id="' . e($id) . '"' : '') . ">{$txt}</h{$lvl}>\n";
            $i++; continue;
        }
        if (preg_match('/^#\s+(.+)$/', $trim, $m)) {
            // un H1 dans le corps ferait doublon avec le titre de la page
            $out .= '<h2>' . md_inline($m[1]) . "</h2>\n";
            $i++; continue;
        }

        // filet horizontal
        if (preg_match('/^(-{3,}|\*{3,}|_{3,})$/', $trim)) {
            $out .= "<hr>\n"; $i++; continue;
        }

        // citation
        if (str_starts_with($trim, '>')) {
            $buf = [];
            while ($i < $n && str_starts_with(trim($lines[$i]), '>')) {
                $buf[] = preg_replace('/^\s*>\s?/', '', $lines[$i]);
                $i++;
            }
            $out .= "<blockquote>\n" . md_to_html(implode("\n", $buf)) . "</blockquote>\n";
            continue;
        }

        // tableau : ligne d'en-tête + ligne de séparation
        if (str_starts_with($trim, '|') && $i + 1 < $n
            && preg_match('/^\s*\|?[\s:|-]+\|[\s:|-]*$/', $lines[$i + 1])) {
            $cells = fn($l) => array_map('trim', explode('|', trim(trim($l), '|')));
            $head = $cells($lines[$i]);
            $i += 2;
            $body = [];
            while ($i < $n && str_starts_with(trim($lines[$i]), '|')) {
                $body[] = $cells($lines[$i]); $i++;
            }
            $out .= "<div class=\"tablewrap\"><table>\n<thead><tr>";
            foreach ($head as $c) $out .= '<th>' . md_inline($c) . '</th>';
            $out .= "</tr></thead>\n<tbody>\n";
            foreach ($body as $row) {
                $out .= '<tr>';
                foreach ($row as $c) $out .= '<td>' . md_inline($c) . '</td>';
                $out .= "</tr>\n";
            }
            $out .= "</tbody>\n</table></div>\n";
            continue;
        }

        // liste
        if (list_item($line) !== null) {
            $items = [];
            while ($i < $n) {
                $it = list_item($lines[$i]);
                if ($it !== null) { $items[] = $it; $i++; continue; }
                // continuation paresseuse : rattachée à l'item courant
                if (trim($lines[$i]) !== '' && preg_match('/^\s+\S/', $lines[$i]) && $items) {
                    $items[count($items) - 1][2] .= ' ' . trim($lines[$i]);
                    $i++; continue;
                }
                break;
            }
            render_list($items, 0, intdiv($items[0][0], 2), $out);
            continue;
        }

        // paragraphe
        $buf = [];
        while ($i < $n) {
            $l = $lines[$i];
            if (trim($l) === '' || list_item($l) !== null
                || preg_match('/^\s*(#{1,4}\s|>|\||\x1AF\d+\x1A$|-{3,}$|\*{3,}$)/', $l)) break;
            $buf[] = $l; $i++;
        }
        if ($buf) {
            $out .= '<p>' . md_inline(implode("\n", $buf)) . "</p>\n";
        } else {
            $i++;   // garde-fou : toujours progresser, jamais de boucle infinie
        }
    }

    return $out;
}

/* ============================ LECTURE DES POSTS ========================= */

if (!is_dir($SRC_DIR)) {
    if (!@mkdir($SRC_DIR, 0755, true)) fail("impossible de créer {$SRC_DIR}");
    logmsg("dossier source créé : {$SRC_DIR}");
}

$files = glob($SRC_DIR . '/*.md') ?: [];
sort($files, SORT_STRING);   // ordre de lecture déterministe, jamais publié tel quel

$posts = [];
$drafts = 0;

foreach ($files as $file) {
    $raw = @file_get_contents($file);
    if ($raw === false) { warn('illisible : ' . basename($file)); continue; }

    [$meta, $body] = parse_front_matter($raw);
    $base = basename($file, '.md');

    $status = strtolower((string)($meta['status'] ?? 'published'));
    if ($status === 'draft') { $drafts++; continue; }

    $title = trim((string)($meta['title'] ?? ''));
    if ($title === '') { warn("titre manquant, ignoré : {$base}.md"); continue; }

    // slug : front-matter, sinon nom de fichier débarrassé de son préfixe de date
    $slug = slugify((string)($meta['slug'] ?? preg_replace('/^\d{4}-\d{2}-\d{2}-/', '', $base)));
    if ($slug === '') { warn("slug vide, ignoré : {$base}.md"); continue; }

    // date : front-matter, sinon préfixe du nom de fichier
    $dateRaw = trim((string)($meta['date'] ?? ''));
    if ($dateRaw === '' && preg_match('/^(\d{4}-\d{2}-\d{2})/', $base, $m)) $dateRaw = $m[1];
    if ($dateRaw === '') { warn("date manquante, ignoré : {$base}.md"); continue; }

    // Heure absente : on en dérive une plausible et STABLE à partir du slug,
    // plutôt que d'aligner tous les articles sur 00:00.
    if (!preg_match('/\d{1,2}:\d{2}/', $dateRaw)) {
        $h = 8 + (crc32($slug) % 14);
        $mi = crc32($slug . 'm') % 60;
        $dateRaw .= sprintf(' %02d:%02d', $h, $mi);
    }
    try {
        $date = new DateTimeImmutable($dateRaw, new DateTimeZone('Europe/Brussels'));
    } catch (Exception $ex) {
        warn("date invalide ('{$dateRaw}'), ignoré : {$base}.md"); continue;
    }

    $updated = null;
    if (!empty($meta['updated'])) {
        try {
            $updated = new DateTimeImmutable((string)$meta['updated'], new DateTimeZone('Europe/Brussels'));
        } catch (Exception $ex) { warn("champ updated invalide dans {$base}.md — ignoré"); }
    }
    if ($updated && $updated < $date) { $updated = null; }

    $tags = $meta['tags'] ?? [];
    if (is_string($tags)) {
        $tags = array_values(array_filter(array_map('trim', explode(',', $tags))));
    }
    $tags = array_values(array_unique(array_map(fn($t) => mb_strtolower(trim((string)$t)), (array)$tags)));

    $html  = md_to_html($body);
    $words = max(1, str_word_count(strip_tags($html), 0, 'àâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ0123456789'));
    $sum   = trim((string)($meta['summary'] ?? ''));
    if ($sum === '') {
        $first = '';
        if (preg_match('~<p>(.*?)</p>~s', $html, $m)) $first = trim(strip_tags($m[1]));
        $sum = mb_substr($first, 0, 180) . (mb_strlen($first) > 180 ? '…' : '');
    }

    if (isset($posts[$slug])) fail("slug en doublon « {$slug} » : " . basename($file));

    $posts[$slug] = [
        'slug'     => $slug,
        'title'    => $title,
        'date'     => $date,
        'updated'  => $updated,
        'tags'     => $tags,
        'summary'  => $sum,
        'ref'      => preg_replace('/[^a-z0-9]/', '', mb_strtolower((string)($meta['ref'] ?? ''))),
        'cover'    => trim((string)($meta['cover'] ?? '')),
        'listed'   => $status !== 'unlisted',
        'html'     => $html,
        'minutes'  => max(1, (int)ceil($words / WPM)),
        'words'    => $words,
        'src'      => basename($file),
    ];
}

/* Tri : date déclarée décroissante. Égalité tranchée par le slug (déterministe),
   JAMAIS par l'ordre d'ajout des fichiers : un article ajouté après coup se
   glisse ainsi à sa place chronologique. */
$all = array_values($posts);
usort($all, function ($a, $b) {
    $c = $b['date'] <=> $a['date'];
    return $c !== 0 ? $c : strcmp($a['slug'], $b['slug']);
});
$listed = array_values(array_filter($all, fn($p) => $p['listed']));

/* ============================== TEMPLATES =============================== */

function head_common(string $title, string $desc, string $canonical, string $extra = '', bool $noindex = false): string {
    return MARKER . "\n"
. '<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>' . e($title) . '</title>
<meta name="description" content="' . e($desc) . '">
<meta name="author" content="' . e(AUTHOR) . '">
<meta name="theme-color" content="#0a0c10">
' . ($noindex ? '<meta name="robots" content="noindex, follow">' . "\n" : '') . '<link rel="canonical" href="' . e($canonical) . '">
<link rel="alternate" type="application/rss+xml" title="' . e(SITE_NAME . ' — ' . BLOG_TITLE) . '" href="' . SITE_URL . '/blog/feed.xml">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%2064%2064\'%3E%3Crect%20width=\'64\'%20height=\'64\'%20rx=\'7\'%20fill=\'%230d1016\'/%3E%3Cpath%20d=\'M9%209H55V43L43%2055H9Z\'%20fill=\'%23ffb13d\'/%3E%3Ctext%20x=\'32\'%20y=\'42\'%20font-family=\'monospace\'%20font-size=\'26\'%20font-weight=\'700\'%20text-anchor=\'middle\'%20fill=\'%230a0c10\'%3EJF%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/blog.css?v=' . CSS_VER . '">
' . $extra . '</head>
<body>
<div class="grain" aria-hidden="true"></div>
<div class="scanlines" aria-hidden="true"></div>

<div class="statusbar">
  <div class="seg"><span class="dot"></span> SYS:ONLINE<span class="sep">/</span>PUBLICATIONS</div>
  <div class="seg hide-s">BELGIQUE 🇧🇪<span class="sep">/</span>CLEARANCE:PUBLIC</div>
  <div class="seg"><a href="/blog/feed.xml">RSS</a></div>
</div>
';
}

function topbar(string $on = ''): string {
    return '<div class="wrap">
  <div class="topbar">
    <a class="blogbrand" href="/" aria-label="Accueil">
      <span class="blogbrand__mono">JF</span>
      <span class="blogbrand__txt"><b>FAFCHAMPS</b><span>sMug@replicatorbe</span></span>
    </a>
    <nav class="topnav" aria-label="Navigation">
      <a href="/">Accueil</a>
      <a href="/blog/"' . ($on === 'blog' ? ' class="on"' : '') . '>Publications</a>
      <a href="/#contact">Contact</a>
    </nav>
  </div>
</div>
';
}

function footer_common(): string {
    return '<footer>
  <div class="wrap foot">
    <div>© ' . date('Y') . ' JÉRÔME FAFCHAMPS <span class="amber">//</span> sMug@replicatorbe <span class="amber">//</span> BELGIQUE 🇧🇪</div>
    <div><a href="/blog/feed.xml">RSS</a> <span class="amber">//</span> <a href="/">retour au site</a></div>
  </div>
</footer>
</body>
</html>
';
}

/** Un article. */
function render_post(array $p, ?array $prev, ?array $next): string {
    $url  = SITE_URL . '/blog/' . $p['slug'] . '/';
    $mod  = $p['updated'] ?? $p['date'];

    $ld = [
        '@context'         => 'https://schema.org',
        '@type'            => 'BlogPosting',
        'headline'         => $p['title'],
        'description'      => $p['summary'],
        'datePublished'    => $p['date']->format(DateTimeInterface::ATOM),
        'dateModified'     => $mod->format(DateTimeInterface::ATOM),
        'inLanguage'       => 'fr-BE',
        'url'              => $url,
        'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
        'author'           => ['@type' => 'Person', 'name' => AUTHOR, 'url' => AUTHOR_URL],
        'publisher'        => ['@type' => 'Person', 'name' => AUTHOR, 'url' => AUTHOR_URL],
        'wordCount'        => $p['words'],
    ];
    if ($p['tags'])  $ld['keywords'] = implode(', ', $p['tags']);
    if ($p['cover']) $ld['image']    = SITE_URL . '/' . ltrim($p['cover'], '/');

    $extra = '<meta property="og:type" content="article">' . "\n"
        . '<meta property="og:title" content="' . e($p['title']) . '">' . "\n"
        . '<meta property="og:description" content="' . e($p['summary']) . '">' . "\n"
        . '<meta property="og:url" content="' . e($url) . '">' . "\n"
        . '<meta property="og:locale" content="fr_BE">' . "\n"
        . '<meta property="article:published_time" content="' . $p['date']->format(DateTimeInterface::ATOM) . '">' . "\n"
        . ($p['updated'] ? '<meta property="article:modified_time" content="' . $mod->format(DateTimeInterface::ATOM) . '">' . "\n" : '')
        . ($p['cover'] ? '<meta property="og:image" content="' . e(SITE_URL . '/' . ltrim($p['cover'], '/')) . '">' . "\n" : '')
        . '<script type="application/ld+json">' . "\n"
        . json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n"
        . '</script>' . "\n";

    $h  = head_common($p['title'] . ' · ' . BLOG_TITLE . ' — ' . SITE_NAME,
                      $p['summary'], $url, $extra, !$p['listed']);
    $h .= topbar();
    $h .= '<main class="wrap">
  <div class="read">
    <div class="crumb"><a href="/">~</a><span class="s">/</span><a href="/blog/">blog</a><span class="s">/</span>' . e($p['slug']) . '</div>

    <header class="art-head">
      <h1>' . e($p['title']) . '</h1>
      <div class="art-meta">
        <time datetime="' . $p['date']->format('Y-m-d') . '">' . e(date_fr($p['date'])) . '</time>
        <span class="s">/</span><span>' . $p['minutes'] . ' min de lecture</span>';
    if ($p['updated']) {
        $h .= '<span class="s">/</span><span>mis à jour le ' . e(date_fr($p['updated'])) . '</span>';
    }
    if (!$p['listed']) {
        $h .= '<span class="s">/</span><span>non listé</span>';
    }
    $h .= '
      </div>' . ($p['summary'] !== '' ? '
      <p class="art-lead">' . e($p['summary']) . '</p>' : '') . '
    </header>

    <article class="prose">
' . $p['html'] . '    </article>

    <div class="art-foot">';
    if ($p['tags']) {
        $h .= '
      <div class="art-tags">';
        foreach ($p['tags'] as $t) {
            $h .= '<a class="tag" href="/blog/?tag=' . e(rawurlencode($t)) . '">' . e($t) . '</a>';
        }
        $h .= '</div>';
    }
    $h .= '
      <div class="pager">';
    $h .= $prev
        ? '<a href="/blog/' . e($prev['slug']) . '/"><span class="lab">← plus ancien</span><span class="ttl">' . e($prev['title']) . '</span></a>'
        : '<span class="ph"></span>';
    $h .= $next
        ? '<a class="nx" href="/blog/' . e($next['slug']) . '/"><span class="lab">plus récent →</span><span class="ttl">' . e($next['title']) . '</span></a>'
        : '<span class="ph"></span>';
    $h .= '</div>

      <div class="frame endcta">
        <div>
          <h3>Une question, un projet&nbsp;?</h3>
          <p>Infrastructure, réseau, sûreté ou cybersécurité — le canal est ouvert.</p>
        </div>
        <a class="btn" href="mailto:' . e(EMAIL) . '">' . e(EMAIL) . ' <span class="ar">↗</span></a>
      </div>
    </div>
  </div>
</main>
';
    return $h . footer_common();
}

/** L'index. */
function render_index(array $posts): string {
    $url = SITE_URL . '/blog/';
    $tags = [];
    foreach ($posts as $p) foreach ($p['tags'] as $t) $tags[$t] = ($tags[$t] ?? 0) + 1;
    ksort($tags);

    $ld = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Blog',
        'name'        => BLOG_TITLE . ' — ' . SITE_NAME,
        'description' => BLOG_DESC,
        'url'         => $url,
        'inLanguage'  => 'fr-BE',
        'author'      => ['@type' => 'Person', 'name' => AUTHOR, 'url' => AUTHOR_URL],
        'blogPost'    => array_map(fn($p) => [
            '@type'         => 'BlogPosting',
            'headline'      => $p['title'],
            'url'           => SITE_URL . '/blog/' . $p['slug'] . '/',
            'datePublished' => $p['date']->format(DateTimeInterface::ATOM),
        ], array_slice($posts, 0, 20)),
    ];

    $extra = '<meta property="og:type" content="website">' . "\n"
        . '<meta property="og:title" content="' . e(BLOG_TITLE . ' — ' . SITE_NAME) . '">' . "\n"
        . '<meta property="og:description" content="' . e(BLOG_DESC) . '">' . "\n"
        . '<meta property="og:url" content="' . e($url) . '">' . "\n"
        . '<meta property="og:locale" content="fr_BE">' . "\n"
        . '<script type="application/ld+json">' . "\n"
        . json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n"
        . '</script>' . "\n";

    $h  = head_common(BLOG_TITLE . ' · ' . SITE_NAME . ' — notes techniques, infra, réseau & sûreté',
                      BLOG_DESC, $url, $extra);
    $h .= topbar('blog');
    $h .= '<main class="wrap">
  <div class="sec-head">
    <div class="sec-meta"><span class="idx">06</span><span>// PUBLICATIONS</span><span class="ln"></span></div>
    <h1 class="sec-title">Ce que j\'<em>écris</em></h1>
    <p class="sec-sub">' . e(BLOG_DESC) . '</p>
  </div>
';

    if (!$posts) {
        $h .= '  <div class="empty">aucune publication pour l\'instant <span class="bk">_</span></div>
';
    } else {
        if (count($tags) > 1) {
            $h .= '  <div class="filters" id="filters">
    <span class="filters__lab">filtrer&nbsp;:</span>
    <button class="chip on" data-tag="">tout <span>(' . count($posts) . ')</span></button>
';
            foreach ($tags as $t => $c) {
                $h .= '    <button class="chip" data-tag="' . e($t) . '">' . e($t) . ' <span>(' . $c . ')</span></button>' . "\n";
            }
            $h .= '  </div>
';
        }
        $h .= '  <ul class="postlist" id="postlist">
';
        foreach ($posts as $p) {
            $h .= '    <li data-tags="' . e(implode(' ', $p['tags'])) . '">
      <a class="postrow" href="/blog/' . e($p['slug']) . '/">
        <div class="postrow__date">' . $p['date']->format('d.m') . '<span class="yr">' . $p['date']->format('Y') . '</span></div>
        <div>
          <h2 class="postrow__title">' . e($p['title']) . '</h2>
          <p class="postrow__sum">' . e($p['summary']) . '</p>
          <div class="postrow__meta">';
            foreach ($p['tags'] as $t) $h .= '<span class="tag">' . e($t) . '</span>';
            $h .= '<span class="rt">' . $p['minutes'] . ' min</span>
          </div>
        </div>
      </a>
    </li>
';
        }
        $h .= '  </ul>
  <div class="empty" id="noresult" hidden>aucune publication pour ce filtre <span class="bk">_</span></div>
';
    }

    $h .= '  <div class="frame endcta">
    <div>
      <h3>Suivre les publications</h3>
      <p>Flux RSS — aucun compte, aucun pistage.</p>
    </div>
    <a class="btn btn--ghost" href="/blog/feed.xml">S\'abonner au flux <span class="ar">→</span></a>
  </div>
</main>
<script>
/* Filtre par tag — purement client, pilotable par ?tag=… */
(function(){
  var chips=document.querySelectorAll("#filters .chip");
  var rows=document.querySelectorAll("#postlist li");
  var none=document.getElementById("noresult");
  if(!chips.length||!rows.length) return;
  function apply(tag){
    var shown=0;
    rows.forEach(function(li){
      var ok=!tag||(" "+li.dataset.tags+" ").indexOf(" "+tag+" ")>-1;
      li.hidden=!ok; if(ok) shown++;
    });
    chips.forEach(function(c){ c.classList.toggle("on", c.dataset.tag===tag); });
    if(none) none.hidden=shown>0;
    var u=new URL(location.href);
    if(tag) u.searchParams.set("tag",tag); else u.searchParams.delete("tag");
    history.replaceState(null,"",u);
  }
  chips.forEach(function(c){ c.addEventListener("click",function(){ apply(c.dataset.tag); }); });
  var q=new URLSearchParams(location.search).get("tag");
  if(q) apply(q.toLowerCase());
})();
</script>
';
    return $h . footer_common();
}

/* ============================== ÉCRITURE =============================== */

function put(string $path, string $content): void {
    $dir = dirname($path);
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) fail("mkdir a échoué : {$dir}");
    if (@file_put_contents($path, $content) === false) fail("écriture impossible : {$path}");
}

/**
 * Aligne le mtime d'un fichier sur la date déclarée.
 * C'est ce qui empêche nginx d'annoncer, via Last-Modified/ETag, une date de
 * modification en contradiction avec la date affichée sur la page.
 */
function stamp(string $path, DateTimeImmutable $d): void {
    if (!@touch($path, $d->getTimestamp())) warn("touch a échoué : {$path}");
}

if (!is_dir($OUT_DIR) && !@mkdir($OUT_DIR, 0755, true)) fail("impossible de créer {$OUT_DIR}");

// --- pages d'articles ---
$written = [];
foreach ($all as $idx => $p) {
    // prev/next dans l'ordre chronologique de la liste publique
    $prev = $next = null;
    if ($p['listed']) {
        $pos = array_search($p['slug'], array_column($listed, 'slug'), true);
        if ($pos !== false) {
            $next = $listed[$pos - 1] ?? null;   // plus récent
            $prev = $listed[$pos + 1] ?? null;   // plus ancien
        }
    }
    $path = $OUT_DIR . '/' . $p['slug'] . '/index.html';
    put($path, render_post($p, $prev, $next));
    stamp($path, $p['updated'] ?? $p['date']);
    stamp(dirname($path), $p['updated'] ?? $p['date']);
    // le .md source aussi, pour que _posts/ reste cohérent avec les dates
    // déclarées (utile si tu synchronises ce dossier ailleurs)
    stamp($SRC_DIR . '/' . $p['src'], $p['updated'] ?? $p['date']);
    $written[$p['slug']] = true;
    logmsg(sprintf('  · %s  %-34s %s', $p['date']->format('Y-m-d'), $p['slug'],
                   $p['listed'] ? '' : '(non listé)'));
}

// --- purge des articles supprimés/repassés en brouillon ---
foreach (glob($OUT_DIR . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    $slug = basename($dir);
    if (isset($written[$slug])) continue;
    $idx = $dir . '/index.html';
    // garde-fou : on ne supprime que ce que ce script a lui-même produit
    if (is_file($idx) && str_contains((string)@file_get_contents($idx), MARKER)) {
        @unlink($idx);
        @rmdir($dir);
        logmsg("  · purgé : blog/{$slug}/");
    } else {
        warn("blog/{$slug}/ n'est pas issu du générateur — laissé en place");
    }
}

// --- index ---
put($OUT_DIR . '/index.html', render_index($listed));

// --- flux RSS 2.0 ---
$rss = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
     . '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n<channel>\n"
     . '  <title>' . e(SITE_NAME . ' — ' . BLOG_TITLE) . "</title>\n"
     . '  <link>' . SITE_URL . "/blog/</link>\n"
     . '  <description>' . e(BLOG_DESC) . "</description>\n"
     . "  <language>fr-be</language>\n"
     . '  <atom:link href="' . SITE_URL . '/blog/feed.xml" rel="self" type="application/rss+xml"/>' . "\n"
     . '  <lastBuildDate>' . (new DateTimeImmutable())->format(DateTimeInterface::RSS) . "</lastBuildDate>\n";
foreach (array_slice($listed, 0, 20) as $p) {
    $u = SITE_URL . '/blog/' . $p['slug'] . '/';
    $rss .= "  <item>\n"
         . '    <title>' . e($p['title']) . "</title>\n"
         . '    <link>' . e($u) . "</link>\n"
         . '    <guid isPermaLink="true">' . e($u) . "</guid>\n"
         // pubDate = date DÉCLARÉE, jamais la date de génération
         . '    <pubDate>' . $p['date']->format(DateTimeInterface::RSS) . "</pubDate>\n"
         . '    <description>' . e($p['summary']) . "</description>\n";
    foreach ($p['tags'] as $t) $rss .= '    <category>' . e($t) . "</category>\n";
    $rss .= "  </item>\n";
}
$rss .= "</channel>\n</rss>\n";
put($OUT_DIR . '/feed.xml', $rss);

// --- sitemap (racine) ---
$map = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
     . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
$home = $ROOT . '/index.html';
$map .= "  <url>\n    <loc>" . SITE_URL . "/</loc>\n"
      . '    <lastmod>' . date('Y-m-d', is_file($home) ? (int)filemtime($home) : time()) . "</lastmod>\n"
      . "    <priority>1.0</priority>\n  </url>\n";
$map .= "  <url>\n    <loc>" . SITE_URL . "/blog/</loc>\n"
      . '    <lastmod>' . ($listed ? $listed[0]['date']->format('Y-m-d') : date('Y-m-d')) . "</lastmod>\n"
      . "    <priority>0.9</priority>\n  </url>\n";
foreach ($listed as $p) {
    // lastmod = date déclarée (ou updated), jamais la date de build
    $map .= "  <url>\n    <loc>" . e(SITE_URL . '/blog/' . $p['slug'] . '/') . "</loc>\n"
          . '    <lastmod>' . ($p['updated'] ?? $p['date'])->format('Y-m-d') . "</lastmod>\n"
          . "    <priority>0.7</priority>\n  </url>\n";
}
$map .= "</urlset>\n";
put($MAP_OUT, $map);

// --- JSON pour la page d'accueil et la commande `blog` du terminal ---
$json = [
    'generated_at' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
    'blog_url'     => SITE_URL . '/blog/',
    'feed_url'     => SITE_URL . '/blog/feed.xml',
    'count'        => count($listed),
    // on n'expose que ce dont la page d'accueil et le terminal ont besoin
    'posts'        => array_map(fn($p) => [
        'title'   => $p['title'],
        'slug'    => $p['slug'],
        'url'     => '/blog/' . $p['slug'] . '/',
        'date'    => $p['date']->format('Y-m-d'),
        'date_fr' => date_fr($p['date']),
        'tags'    => $p['tags'],
        'summary' => $p['summary'],
        'minutes' => $p['minutes'],
    ], array_slice($listed, 0, TEASER_N)),
];
put($JSON_OUT, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");

logmsg(sprintf('terminé : %d publiée(s) · %d non listée(s) · %d brouillon(s)',
    count($listed), count($all) - count($listed), $drafts));
