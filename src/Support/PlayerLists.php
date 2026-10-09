<?php

declare(strict_types=1);

namespace Minecraft\Support;

use DateTimeImmutable;

/**
 * Edits the server's JSON player lists the same way the server itself writes them.
 */
final class PlayerLists
{
    /**
     * @param  list<array<string, mixed>>  $list
     * @param  array<string, mixed>  $entry
     * @return list<array<string, mixed>>
     */
    public static function put(array $list, array $entry, string $matchKey): array
    {
        $list = self::remove($list, (string) $entry[$matchKey], $matchKey);
        $list[] = $entry;

        return $list;
    }

    /**
     * @param  list<array<string, mixed>>  $list
     * @return list<array<string, mixed>>
     */
    public static function remove(array $list, string $value, string $matchKey): array
    {
        return array_values(array_filter(
            $list,
            static fn (array $entry): bool => mb_strtolower((string) ($entry[$matchKey] ?? '')) !== mb_strtolower($value),
        ));
    }

    /** @return array{uuid: string, name: string} */
    public static function whitelistEntry(string $uuid, string $name): array
    {
        return ['uuid' => $uuid, 'name' => $name];
    }

    /** @return array{uuid: string, name: string, level: int, bypassesPlayerLimit: bool} */
    public static function operatorEntry(string $uuid, string $name, int $level): array
    {
        return ['uuid' => $uuid, 'name' => $name, 'level' => $level, 'bypassesPlayerLimit' => false];
    }

    /** @return array<string, string> */
    public static function banEntry(string $key, string $value, ?string $name, string $reason, DateTimeImmutable $now): array
    {
        return array_filter([
            $key => $value,
            'name' => $name,
            'created' => $now->format('Y-m-d H:i:s O'),
            'source' => 'Pterodactyl',
            'expires' => 'forever',
            'reason' => $reason !== '' ? $reason : 'Banned by an operator.',
        ], static fn (?string $value): bool => $value !== null);
    }
}
