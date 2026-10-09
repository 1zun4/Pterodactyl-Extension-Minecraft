<?php

declare(strict_types=1);

namespace Minecraft\Support;

/**
 * Merges the server's player lists into one entry per player.
 */
final class PlayerDirectory
{
    /**
     * @param  list<array<string, mixed>>  $usercache
     * @param  list<array<string, mixed>>  $ops
     * @param  list<array<string, mixed>>  $whitelist
     * @param  list<array<string, mixed>>  $bans
     * @param  list<string>  $savedUuids
     * @param  list<array{name: string, uuid: string|null}>  $online
     * @return list<array{uuid: string|null, name: string, online: bool, operator: bool, op_level: int|null, whitelisted: bool, banned: bool, ban_reason: string|null, last_seen: string|null}>
     */
    public static function build(array $usercache, array $ops, array $whitelist, array $bans, array $savedUuids, array $online): array
    {
        $players = [];

        $touch = static function (?string $uuid, ?string $name) use (&$players): ?string {
            if ($uuid !== null && Uuid::isValid($uuid)) {
                $uuid = Uuid::normalize($uuid);
            } elseif ($name !== null) {
                foreach ($players as $key => $player) {
                    if (mb_strtolower($player['name']) === mb_strtolower($name)) {
                        return $key;
                    }
                }

                $uuid = null;
            } else {
                return null;
            }

            $key = $uuid ?? 'name:'.mb_strtolower((string) $name);
            $players[$key] ??= [
                'uuid' => $uuid,
                'name' => $name ?? $uuid,
                'online' => false,
                'operator' => false,
                'op_level' => null,
                'whitelisted' => false,
                'banned' => false,
                'ban_reason' => null,
                'last_seen' => null,
            ];

            if ($name !== null && $players[$key]['name'] === $uuid) {
                $players[$key]['name'] = $name;
            }

            return $key;
        };

        foreach ($usercache as $entry) {
            $key = $touch(self::string($entry, 'uuid'), self::string($entry, 'name'));

            if ($key !== null) {
                $players[$key]['last_seen'] = self::string($entry, 'expiresOn');
            }
        }

        foreach ($ops as $entry) {
            $key = $touch(self::string($entry, 'uuid'), self::string($entry, 'name'));

            if ($key !== null) {
                $players[$key]['operator'] = true;
                $players[$key]['op_level'] = isset($entry['level']) ? (int) $entry['level'] : null;
            }
        }

        foreach ($whitelist as $entry) {
            $key = $touch(self::string($entry, 'uuid'), self::string($entry, 'name'));

            if ($key !== null) {
                $players[$key]['whitelisted'] = true;
            }
        }

        foreach ($bans as $entry) {
            $key = $touch(self::string($entry, 'uuid'), self::string($entry, 'name'));

            if ($key !== null) {
                $players[$key]['banned'] = true;
                $players[$key]['ban_reason'] = self::string($entry, 'reason');
            }
        }

        foreach ($savedUuids as $uuid) {
            $touch($uuid, null);
        }

        foreach ($online as $entry) {
            $key = $touch($entry['uuid'], $entry['name']);

            if ($key !== null) {
                $players[$key]['online'] = true;
            }
        }

        $list = array_values($players);
        usort($list, static fn (array $a, array $b): int => [$b['online'], mb_strtolower($a['name'])] <=> [$a['online'], mb_strtolower($b['name'])]);

        return $list;
    }

    /** @param array<string, mixed> $entry */
    private static function string(array $entry, string $key): ?string
    {
        return isset($entry[$key]) && is_scalar($entry[$key]) && (string) $entry[$key] !== '' ? (string) $entry[$key] : null;
    }
}
