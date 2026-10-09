<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use Minecraft\Support\Nbt;
use Minecraft\Tests\Support\NbtWriter;
use PHPUnit\Framework\TestCase;
use UnexpectedValueException;

final class NbtTest extends TestCase
{
    public function test_decodes_every_common_tag(): void
    {
        $file = NbtWriter::file([
            'byte' => [1, -5],
            'short' => [2, -300],
            'int' => [3, -70000],
            'long' => [4, 1234567890123],
            'float' => [5, 1.5],
            'double' => [6, -2.25],
            'string' => [8, 'Hellö'],
            'list' => [9, [8, ['a', 'b']]],
            'nested' => [10, ['inner' => [3, 7]]],
            'ints' => [11, [1, -2]],
        ]);

        $this->assertSame([
            'byte' => -5,
            'short' => -300,
            'int' => -70000,
            'long' => 1234567890123,
            'float' => 1.5,
            'double' => -2.25,
            'string' => 'Hellö',
            'list' => ['a', 'b'],
            'nested' => ['inner' => 7],
            'ints' => [1, -2],
        ], Nbt::decode($file));
    }

    public function test_reads_uncompressed_data(): void
    {
        $this->assertSame(['a' => 1], Nbt::decode(NbtWriter::file(['a' => [1, 1]], gzip: false)));
    }

    public function test_rejects_truncated_data(): void
    {
        $this->expectException(UnexpectedValueException::class);

        Nbt::decode(mb_substr(NbtWriter::file(['text' => [8, 'abcdef']], gzip: false), 0, 10, '8bit'));
    }
}
