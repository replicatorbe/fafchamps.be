<?php
/**
 * update-github-fafchamps.php
 * ---------------------------------------------------------------------------
 * Récupère l'activité GitHub publique de Jérôme Fafchamps (@replicatorbe) et
 * écrit un JSON statique lu par fafchamps.be (section « Activité GitHub »).
 *
 * Tout est volontairement contenu dans le répertoire du site (_cron/ + data/)
 * pour qu'une migration de serveur = copier le dossier fafchamps.be/.
 *
 * Source PRIMAIRE  : API GitHub officielle (GraphQL pour le mur de
 *                    contributions + REST pour les repos), via un token.
 * Source FALLBACK  : si aucun token n'est configuré, on retombe sur l'API
 *                    publique REST (repos) + le service tiers jogruber pour
 *                    le total de contributions, afin que la page ne soit
 *                    jamais vide. Ajoute le token pour passer 100% officiel.
 *
 * SÉCURITÉ
 *   - Ce script ne s'exécute QU'EN CLI (cf. garde ci-dessous) : impossible de
 *     le déclencher via le web.
 *   - Le token vit dans _cron/secret.php sous la forme « <?php return '...'; ».
 *     nginx route les .php vers PHP-FPM : si quelqu'un télécharge secret.php,
 *     il reçoit un corps VIDE — jamais la valeur du token.
 *
 * Exécution (cron, depuis le host) :
 *   docker exec shared-php php /var/www/fafchamps.be/_cron/update-github-fafchamps.php
 * ---------------------------------------------------------------------------
 */

if (PHP_SAPI !== 'cli') {            // garde : jamais exécutable via le web
    http_response_code(403);
    exit;
}

date_default_timezone_set('Europe/Brussels');

/* ----------------------------- CONFIG ----------------------------------- */
const LOGIN     = 'replicatorbe';
const MAX_REPOS = 12;
const UA        = 'fafchamps.be-activity/1.0 (+https://www.fafchamps.be)';

$OUT_FILE    = dirname(__DIR__) . '/data/github.json';   // fafchamps.be/data/github.json
$SECRET_FILE = __DIR__ . '/secret.php';                  // fafchamps.be/_cron/secret.php
$LOG_FILE    = __DIR__ . '/update-github.log';           // cible du >> de la crontab

const LOG_KEEP = 500;                                    // lignes conservées

/* ----------------------------- HELPERS ---------------------------------- */
function logmsg(string $m): void {
    fwrite(STDERR, '[' . date('Y-m-d H:i:s') . '] ' . $m . "\n");
}

/**
 * Le cron ajoute la sortie de ce script au journal sans que rien ne le borne :
 * le fichier grossit indéfiniment. On garde les LOG_KEEP dernières lignes.
 *
 * La troncature se fait **en place** (r+ puis ftruncate) et jamais par un fichier
 * temporaire renommé : le shell du cron tient déjà ce fichier ouvert en écriture
 * ajoutée, et un rename lui laisserait un descripteur sur l'ancien inode — les
 * lignes de la session en cours partiraient dans un fichier déjà supprimé.
 */
function rotate_log(string $file, int $keep = LOG_KEEP): void {
    if (!is_file($file) || !is_writable($file)) return;

    $taille = @filesize($file);
    if ($taille === false || $taille === 0) return;

    $fh = @fopen($file, 'r+');
    if (!$fh) return;
    if (!flock($fh, LOCK_EX)) { fclose($fh); return; }

    // Lecture bornée : on ne relit jamais plus que la queue du fichier.
    $lire = (int) min($taille, 1 << 20);
    fseek($fh, $taille - $lire);
    $queue  = (string) stream_get_contents($fh);
    $lignes = explode("\n", $queue);
    if ($lire < $taille) array_shift($lignes);   // première ligne coupée au milieu

    if ($lire >= $taille && count($lignes) <= $keep) {
        flock($fh, LOCK_UN); fclose($fh); return;
    }

    $garde = implode("\n", array_slice($lignes, -$keep));
    rewind($fh);
    fwrite($fh, $garde);
    ftruncate($fh, strlen($garde));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

rotate_log($LOG_FILE);

/** Requête HTTP simple, renvoie [http_code, body|null]. */
function http(string $url, array $headers = [], ?string $postBody = null): array {
    $ch = curl_init($url);
    $opt = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_USERAGENT      => UA,
        CURLOPT_HTTPHEADER     => array_merge(['Accept: application/json'], $headers),
    ];
    if ($postBody !== null) {
        $opt[CURLOPT_POST]       = true;
        $opt[CURLOPT_POSTFIELDS] = $postBody;
    }
    curl_setopt_array($ch, $opt);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($body === false) { logmsg('curl error: ' . curl_error($ch)); $body = null; }
    curl_close($ch);
    return [$code, $body === false ? null : $body];
}

function readToken(string $secretFile): ?string {
    $t = getenv('GITHUB_TOKEN');
    if ($t !== false && trim($t) !== '') return trim($t);
    if (is_file($secretFile)) {
        $t = include $secretFile;            // secret.php => return 'ghp_xxx';
        if (is_string($t) && trim($t) !== '') return trim($t);
    }
    return null;
}

/* ------------------- CONTRIBUTIONS via GraphQL (token) ------------------- */
function fetchContributionsOfficial(string $token): ?array {
    $query = 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}';
    $payload = json_encode(['query' => $query, 'variables' => ['login' => LOGIN]]);
    [$code, $body] = http(
        'https://api.github.com/graphql',
        ['Authorization: bearer ' . $token, 'Content-Type: application/json'],
        $payload
    );
    if ($code !== 200 || !$body) { logmsg("GraphQL contributions: HTTP $code"); return null; }
    $j = json_decode($body, true);
    $cal = $j['data']['user']['contributionsCollection']['contributionCalendar'] ?? null;
    if (!$cal) { logmsg('GraphQL: réponse inattendue: ' . substr($body, 0, 200)); return null; }
    $days = [];
    foreach ($cal['weeks'] as $w) {
        foreach ($w['contributionDays'] as $d) {
            $days[] = ['date' => $d['date'], 'count' => (int) $d['contributionCount']];
        }
    }
    return ['total' => (int) $cal['totalContributions'], 'days' => $days, 'source' => 'github-graphql'];
}

/* ------------------ CONTRIBUTIONS via jogruber (fallback) ---------------- */
function fetchContributionsFallback(): ?array {
    [$code, $body] = http('https://github-contributions-api.jogruber.de/v4/' . LOGIN . '?y=last');
    if ($code !== 200 || !$body) { logmsg("jogruber: HTTP $code"); return null; }
    $j = json_decode($body, true);
    if (!isset($j['total']['lastYear'], $j['contributions'])) { logmsg('jogruber: format inattendu'); return null; }
    $days = [];
    foreach ($j['contributions'] as $d) {
        $days[] = ['date' => $d['date'], 'count' => (int) $d['count']];
    }
    return ['total' => (int) $j['total']['lastYear'], 'days' => $days, 'source' => 'jogruber'];
}

/* ------------------------------- REPOS ---------------------------------- */
function fetchRepos(?string $token): array {
    $headers = $token ? ['Authorization: bearer ' . $token] : [];
    [$code, $body] = http(
        'https://api.github.com/users/' . LOGIN . '/repos?sort=updated&per_page=100&type=owner',
        $headers
    );
    if ($code !== 200 || !$body) { logmsg("repos REST: HTTP $code"); return []; }
    $all = json_decode($body, true);
    if (!is_array($all)) return [];
    $repos = [];
    foreach ($all as $r) {
        if (!empty($r['fork']) || !empty($r['archived'])) continue;       // que les vrais repos perso
        $repos[] = [
            'name'    => $r['name'],
            'desc'    => $r['description'] ?? null,
            'lang'    => $r['language'] ?? null,
            'updated' => substr($r['pushed_at'] ?? $r['updated_at'], 0, 10),
            'url'     => $r['html_url'],
            'stars'   => (int) ($r['stargazers_count'] ?? 0),
        ];
    }
    usort($repos, fn($a, $b) => strcmp($b['updated'], $a['updated']));
    return array_slice($repos, 0, MAX_REPOS);
}

/* -------------------------------- MAIN ---------------------------------- */
$token = readToken($SECRET_FILE);
if ($token) {
    logmsg('Token détecté → source officielle GitHub.');
    $contrib = fetchContributionsOfficial($token) ?? fetchContributionsFallback();
} else {
    logmsg('Aucun token (GITHUB_TOKEN / ' . $SECRET_FILE . ') → fallback public jogruber. '
         . 'Ajoute un token pour passer 100% officiel.');
    $contrib = fetchContributionsFallback();
}

$repos = fetchRepos($token);

if (!$contrib && !$repos) {
    logmsg('ÉCHEC : aucune donnée récupérée. Le fichier existant est conservé.');
    exit(1);
}

$out = [
    'generated_at'  => date('c'),
    'login'         => LOGIN,
    'profile_url'   => 'https://github.com/' . LOGIN,
    'contributions' => $contrib ?: ['total' => null, 'days' => [], 'source' => 'unavailable'],
    'repos'         => $repos,
    'repos_count'   => count($repos),
];

$json = json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$tmp  = $OUT_FILE . '.tmp';
if (file_put_contents($tmp, $json) === false || !rename($tmp, $OUT_FILE)) {
    logmsg('ÉCHEC écriture ' . $OUT_FILE);
    @unlink($tmp);
    exit(1);
}
@chmod($OUT_FILE, 0644);
logmsg(sprintf('OK → %s (contrib total=%s, source=%s, repos=%d)',
    $OUT_FILE,
    $contrib['total'] ?? 'n/a',
    $contrib['source'] ?? 'n/a',
    count($repos)
));
