<?php

declare(strict_types=1);

namespace Minecraft\Support;

use UnexpectedValueException;

/**
 * Minimal reader for Java edition NBT (big-endian, optionally gzipped).
 */
final class Nbt
{
    private const int MAX_DEPTH = 64;

    private const int MAX_INFLATED_BYTES = 16 * 1024 * 1024;

    private int $offset = 0;

    private readonly int $length;

    private function __construct(private readonly string $data)
    {
        $this->length = mb_strlen($data, '8bit');
    }

    /** @return array<string, mixed> */
    public static function decode(string $data): array
    {
        if (str_starts_with($data, "\x1f\x8b")) {
            $data = @gzdecode($data, self::MAX_INFLATED_BYTES);

            if ($data === false) {
                throw new UnexpectedValueException('The NBT data could not be decompressed.');
            }
        }

        $reader = new self($data);

        if ($reader->unsigned(1) !== 10) {
            throw new UnexpectedValueException('The NBT data does not start with a compound tag.');
        }

        $reader->string();

        return $reader->compound(0);
    }

    /** @return array<string, mixed> */
    private function compound(int $depth): array
    {
        $this->guardDepth($depth);
        $values = [];

        while (($type = $this->unsigned(1)) !== 0) {
            $name = $this->string();
            $values[$name] = $this->payload($type, $depth + 1);
        }

        return $values;
    }

    private function payload(int $type, int $depth): mixed
    {
        return match ($type) {
            1 => $this->signed(1),
            2 => $this->signed(2),
            3 => $this->signed(4),
            4 => $this->signed(8),
            5 => unpack('G', $this->take(4))[1],
            6 => unpack('E', $this->take(8))[1],
            7 => array_map(static fn (int $byte): int => $byte > 127 ? $byte - 256 : $byte, array_values(unpack('C*', $this->take($this->arrayLength(1))) ?: [])),
            8 => $this->string(),
            9 => $this->list($depth),
            10 => $this->compound($depth),
            11 => $this->numbers(4),
            12 => $this->numbers(8),
            default => throw new UnexpectedValueException("Unknown NBT tag type {$type}."),
        };
    }

    /** @return list<mixed> */
    private function list(int $depth): array
    {
        $this->guardDepth($depth);
        $type = $this->unsigned(1);
        $count = $this->signed(4);
        $items = [];

        for ($i = 0; $i < $count; $i++) {
            $items[] = $this->payload($type, $depth + 1);
        }

        return $items;
    }

    /** @return list<int> */
    private function numbers(int $width): array
    {
        $count = $this->arrayLength($width);
        $items = [];

        for ($i = 0; $i < $count; $i++) {
            $items[] = $this->signed($width);
        }

        return $items;
    }

    private function arrayLength(int $width): int
    {
        $count = $this->signed(4);

        if ($count < 0 || $count * $width > $this->length - $this->offset) {
            throw new UnexpectedValueException('The NBT data is truncated.');
        }

        return $count;
    }

    private function string(): string
    {
        return $this->take($this->unsigned(2));
    }

    private function unsigned(int $bytes): int
    {
        return unpack($bytes === 1 ? 'C' : 'n', $this->take($bytes))[1];
    }

    private function signed(int $bytes): int
    {
        $value = match ($bytes) {
            1 => unpack('c', $this->take(1))[1],
            2 => unpack('n', $this->take(2))[1],
            4 => unpack('N', $this->take(4))[1],
            8 => unpack('J', $this->take(8))[1],
        };

        return match ($bytes) {
            2 => $value >= 0x8000 ? $value - 0x10000 : $value,
            4 => $value >= 0x80000000 ? $value - 0x100000000 : $value,
            default => $value,
        };
    }

    private function take(int $bytes): string
    {
        if ($this->offset + $bytes > $this->length) {
            throw new UnexpectedValueException('The NBT data is truncated.');
        }

        $chunk = mb_substr($this->data, $this->offset, $bytes, '8bit');
        $this->offset += $bytes;

        return $chunk;
    }

    private function guardDepth(int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new UnexpectedValueException('The NBT data is nested too deeply.');
        }
    }
}
