<?php

declare(strict_types=1);

namespace Minecraft\Support;

final class Uuid
{
    public const string PATTERN = '/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i';

    public static function isValid(string $uuid): bool
    {
        return preg_match(self::PATTERN, $uuid) === 1;
    }

    public static function normalize(string $uuid): string
    {
        $hex = mb_strtolower(str_replace('-', '', $uuid));

        return sprintf('%s-%s-%s-%s-%s', mb_substr($hex, 0, 8), mb_substr($hex, 8, 4), mb_substr($hex, 12, 4), mb_substr($hex, 16, 4), mb_substr($hex, 20));
    }

    /** The UUID an offline-mode server assigns to a player name. */
    public static function offline(string $name): string
    {
        $hash = md5('OfflinePlayer:'.$name, true);
        $hash[6] = chr(ord($hash[6]) & 0x0F | 0x30);
        $hash[8] = chr(ord($hash[8]) & 0x3F | 0x80);

        return self::normalize(bin2hex($hash));
    }
}
