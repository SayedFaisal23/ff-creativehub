<?php

$path = $argv[1] ?? '';
if ($path === '' || ! is_file($path)) {
    fwrite(STDERR, "Usage: php tools/extract_pdf_text.php file.pdf\n");
    exit(1);
}

$pdf = file_get_contents($path);
$fontObjects = extractFontObjects($pdf);
$fontMaps = [];
foreach ($fontObjects as $fontName => $objectId) {
    $fontMaps[$fontName] = extractToUnicodeMap($pdf, $objectId);
}

preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $pdf, $matches);

$text = [];
foreach ($matches[1] as $stream) {
    $decoded = decodeStream($stream);
    if (! str_contains($decoded, 'BT')) {
        continue;
    }

    preg_match_all('/BT(.*?)ET/s', $decoded, $blocks);
    foreach ($blocks[1] as $block) {
        preg_match_all('/\/(F\d+)\s+[\d.]+\s+Tf|(\[(?:.|\n)*?\]\s*TJ)|(<[0-9A-Fa-f]+>\s*Tj)|(\((?:\\\\.|[^\\\\)])*\)\s*Tj)/s', $block, $ops, PREG_SET_ORDER);
        $currentFont = null;
        foreach ($ops as $op) {
            if (! empty($op[1])) {
                $currentFont = $op[1];
                continue;
            }

            $map = $fontMaps[$currentFont] ?? [];
            $value = $op[2] ?: ($op[3] ?: $op[4]);
            $text[] = decodeTextOperation($value, $map);
            $text[] = "\n";
        }
    }
}

$joined = preg_replace('/[ \t]+/', ' ', implode('', $text));
$joined = preg_replace('/\n{3,}/', "\n\n", $joined);
echo trim($joined).PHP_EOL;

function decodePdfString(string $value): string
{
    $value = trim($value);
    if (str_ends_with($value, 'Tj')) {
        $value = trim(substr($value, 0, -2));
    }
    if (str_starts_with($value, '(') && str_ends_with($value, ')')) {
        $value = substr($value, 1, -1);
    }

    $value = preg_replace_callback('/\\\\([0-7]{1,3})/', fn ($match) => chr(octdec($match[1])), $value);
    return strtr($value, [
        '\\n' => "\n",
        '\\r' => "\n",
        '\\t' => "\t",
        '\\(' => '(',
        '\\)' => ')',
        '\\\\' => '\\',
    ]);
}

function decodeTextOperation(string $operation, array $map): string
{
    preg_match_all('/<([0-9A-Fa-f]+)>|\((?:\\\\.|[^\\\\)])*\)/s', $operation, $parts, PREG_SET_ORDER);
    $text = '';
    foreach ($parts as $part) {
        if (! empty($part[1])) {
            $hex = $part[1];
            for ($index = 0; $index < strlen($hex); $index += 2) {
                $code = strtoupper(substr($hex, $index, 2));
                $text .= $map[$code] ?? '';
            }
            continue;
        }

        $text .= decodePdfString($part[0]);
    }

    return $text;
}

function extractFontObjects(string $pdf): array
{
    $fonts = [];
    preg_match_all('/\/(F\d+)\s+(\d+)\s+0\s+R/', $pdf, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $fonts[$match[1]] = (int) $match[2];
    }

    return $fonts;
}

function extractToUnicodeMap(string $pdf, int $fontObjectId): array
{
    if (! preg_match('/'.$fontObjectId.'\s+0\s+obj(.*?)endobj/s', $pdf, $fontObject)) {
        return [];
    }
    if (! preg_match('/\/ToUnicode\s+(\d+)\s+0\s+R/', $fontObject[1], $unicodeRef)) {
        return [];
    }
    if (! preg_match('/'.$unicodeRef[1].'\s+0\s+obj(.*?)endobj/s', $pdf, $unicodeObject)) {
        return [];
    }
    if (! preg_match('/stream\r?\n(.*?)\r?\nendstream/s', $unicodeObject[1], $stream)) {
        return [];
    }

    $decoded = decodeStream($stream[1]);
    $map = [];
    preg_match_all('/<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/', $decoded, $pairs, PREG_SET_ORDER);
    foreach ($pairs as $pair) {
        $map[strtoupper($pair[1])] = unicodeHexToString($pair[2]);
    }

    return $map;
}

function unicodeHexToString(string $hex): string
{
    $chars = '';
    for ($index = 0; $index < strlen($hex); $index += 4) {
        $code = hexdec(substr($hex, $index, 4));
        if ($code < 128) {
            $chars .= chr($code);
        } elseif ($code < 2048) {
            $chars .= chr(192 | ($code >> 6)).chr(128 | ($code & 63));
        } else {
            $chars .= chr(224 | ($code >> 12)).chr(128 | (($code >> 6) & 63)).chr(128 | ($code & 63));
        }
    }

    return $chars;
}

function decodeStream(string $stream): string
{
    $decoded = @gzuncompress($stream);
    if ($decoded === false) {
        $decoded = @gzdecode($stream);
    }

    return $decoded === false ? $stream : $decoded;
}
