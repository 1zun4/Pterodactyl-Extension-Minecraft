<?php

declare(strict_types=1);

namespace Minecraft\Tests\Support;

/**
 * Builds NBT test fixtures. Values are [type, payload] pairs.
 */
final class NbtWriter
{
    /** @param array<string, array{int, mixed}> $root */
    public static function file(array $root, bool $gzip = true): string
    {
        $data = "\x0A".self::string('').self::compound($root);

        return $gzip ? (string) gzencode($data) : $data;
    }

    /** @param array<string, array{int, mixed}> $values */
    public static function compound(array $values): string
    {
        $out = '';

        foreach ($values as $name => [$type, $payload]) {
            $out .= chr($type).self::string((string) $name).self::payload($type, $payload);
        }

        return $out."\x00";
    }

    private static function payload(int $type, mixed $payload): string
    {
        return match ($type) {
            1 => pack('c', $payload),
            2 => pack('n', $payload & 0xFFFF),
            3 => pack('N', $payload & 0xFFFFFFFF),
            4 => pack('J', $payload),
            5 => pack('G', $payload),
            6 => pack('E', $payload),
            8 => self::string($payload),
            9 => chr($payload[0]).pack('N', count($payload[1])).implode('', array_map(static fn (mixed $item): string => self::payload($payload[0], $item), $payload[1])),
            10 => self::compound($payload),
            11 => pack('N', count($payload)).implode('', array_map(static fn (int $value): string => pack('N', $value & 0xFFFFFFFF), $payload)),
        };
    }

    private static function string(string $value): string
    {
        return pack('n', mb_strlen($value, '8bit')).$value;
    }
}
