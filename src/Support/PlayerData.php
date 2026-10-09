<?php

declare(strict_types=1);

namespace Minecraft\Support;

/**
 * Turns a player's .dat, stats and advancements files into the shape the Players screen renders.
 */
final class PlayerData
{
    private const array GAME_MODES = ['survival', 'creative', 'adventure', 'spectator'];

    private const array LEGACY_ARMOR_SLOTS = [103 => 'head', 102 => 'chest', 101 => 'legs', 100 => 'feet'];

    /**
     * @param  array<string, mixed>  $nbt
     * @return array<string, mixed>
     */
    public static function fromNbt(array $nbt): array
    {
        $inventory = ['armor' => ['head' => null, 'chest' => null, 'legs' => null, 'feet' => null], 'offhand' => null, 'main' => [], 'hotbar' => []];

        foreach (self::list($nbt['Inventory'] ?? []) as $item) {
            $slot = (int) ($item['Slot'] ?? -1);
            $normalized = self::item($item);

            if ($slot >= 0 && $slot <= 8) {
                $inventory['hotbar'][$slot] = $normalized;
            } elseif ($slot >= 9 && $slot <= 35) {
                $inventory['main'][$slot - 9] = $normalized;
            } elseif (isset(self::LEGACY_ARMOR_SLOTS[$slot])) {
                $inventory['armor'][self::LEGACY_ARMOR_SLOTS[$slot]] = $normalized;
            } elseif ($slot === -106) {
                $inventory['offhand'] = $normalized;
            }
        }

        $equipment = is_array($nbt['equipment'] ?? null) ? $nbt['equipment'] : [];

        foreach (['head', 'chest', 'legs', 'feet'] as $part) {
            if (is_array($equipment[$part] ?? null)) {
                $inventory['armor'][$part] = self::item($equipment[$part]);
            }
        }

        if (is_array($equipment['offhand'] ?? null)) {
            $inventory['offhand'] = self::item($equipment['offhand']);
        }

        $ender = [];

        foreach (self::list($nbt['EnderItems'] ?? []) as $item) {
            $slot = (int) ($item['Slot'] ?? -1);

            if ($slot >= 0 && $slot <= 26) {
                $ender[$slot] = self::item($item);
            }
        }

        $position = is_array($nbt['Pos'] ?? null) ? array_values($nbt['Pos']) : [];

        return [
            'inventory' => [
                'armor' => $inventory['armor'],
                'offhand' => $inventory['offhand'],
                'main' => self::slots($inventory['main'], 27),
                'hotbar' => self::slots($inventory['hotbar'], 9),
            ],
            'ender_chest' => self::slots($ender, 27),
            'health' => round((float) ($nbt['Health'] ?? 0), 1),
            'food' => (int) ($nbt['foodLevel'] ?? 0),
            'xp_level' => (int) ($nbt['XpLevel'] ?? 0),
            'game_mode' => self::GAME_MODES[(int) ($nbt['playerGameType'] ?? 0)] ?? 'survival',
            'dimension' => self::dimension($nbt['Dimension'] ?? 'minecraft:overworld'),
            'position' => count($position) === 3 ? array_map(static fn (mixed $value): float => round((float) $value, 1), $position) : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $stats
     * @return array<string, int>
     */
    public static function statistics(array $stats): array
    {
        $custom = $stats['stats']['minecraft:custom'] ?? [];
        $value = static fn (string ...$keys): int => (int) array_sum(array_map(static fn (string $key): int => (int) ($custom['minecraft:'.$key] ?? 0), $keys));

        return [
            'play_time' => $value('play_time') ?: $value('play_one_minute'),
            'deaths' => $value('deaths'),
            'mob_kills' => $value('mob_kills'),
            'player_kills' => $value('player_kills'),
            'distance_walked' => $value('walk_one_cm', 'sprint_one_cm'),
        ];
    }

    /** @param array<string, mixed> $advancements */
    public static function completedAdvancements(array $advancements): int
    {
        $done = 0;

        foreach ($advancements as $key => $progress) {
            if (is_array($progress) && ($progress['done'] ?? false) === true && ! str_starts_with((string) $key, 'minecraft:recipes/')) {
                $done++;
            }
        }

        return $done;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array{id: string, count: int, name: string|null, enchanted: bool, damage: int}
     */
    private static function item(array $item): array
    {
        $components = is_array($item['components'] ?? null) ? $item['components'] : [];
        $tag = is_array($item['tag'] ?? null) ? $item['tag'] : [];

        return [
            'id' => (string) ($item['id'] ?? 'minecraft:air'),
            'count' => (int) ($item['count'] ?? $item['Count'] ?? 1),
            'name' => self::customName($components['minecraft:custom_name'] ?? $tag['display']['Name'] ?? null),
            'enchanted' => ! empty($components['minecraft:enchantments']['levels'] ?? $components['minecraft:enchantments'] ?? $tag['Enchantments'] ?? null)
                || isset($components['minecraft:enchantment_glint_override']),
            'damage' => (int) ($components['minecraft:damage'] ?? $tag['Damage'] ?? 0),
        ];
    }

    private static function customName(mixed $name): ?string
    {
        if (is_array($name)) {
            return isset($name['text']) ? (string) $name['text'] : null;
        }

        if (! is_string($name) || $name === '') {
            return null;
        }

        $decoded = json_decode($name, true);

        return match (true) {
            is_string($decoded) => $decoded,
            is_array($decoded) && isset($decoded['text']) => (string) $decoded['text'],
            default => $name,
        };
    }

    private static function dimension(mixed $dimension): string
    {
        $name = is_int($dimension) ? match ($dimension) {
            -1 => 'the_nether',
            1 => 'the_end',
            default => 'overworld',
        } : (string) $dimension;

        return str_replace('minecraft:', '', $name);
    }

    /**
     * @param  array<int, mixed>  $items
     * @return list<mixed>
     */
    private static function slots(array $items, int $size): array
    {
        $slots = array_fill(0, $size, null);

        foreach ($items as $index => $item) {
            $slots[$index] = $item;
        }

        return $slots;
    }

    /** @return list<array<string, mixed>> */
    private static function list(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, is_array(...))) : [];
    }
}
