<?php
/**
 * lib-slug.php — slugification partagée par build-blog.php et new-post.php,
 * pour que l'URL dérivée d'un titre soit identique dans les deux sens.
 */

if (!function_exists('slugify')) {
    function slugify(string $s): string {
        $s = mb_strtolower(trim($s));
        $map = ['à'=>'a','á'=>'a','â'=>'a','ä'=>'a','ã'=>'a','å'=>'a','é'=>'e','è'=>'e','ê'=>'e',
                'ë'=>'e','í'=>'i','ì'=>'i','î'=>'i','ï'=>'i','ó'=>'o','ò'=>'o','ô'=>'o','ö'=>'o',
                'õ'=>'o','ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ý'=>'y','ÿ'=>'y','ñ'=>'n','ç'=>'c',
                'œ'=>'oe','æ'=>'ae','ß'=>'ss','€'=>'e','&'=>'et','@'=>'a'];
        $s = strtr($s, $map);
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
        return trim($s, '-');
    }
}
