<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use Minecraft\Support\Uuid;
use PHPUnit\Framework\TestCase;

final class UuidTest extends TestCase
{
    public function test_offline_uuid_matches_the_server(): void
    {
        $this->assertSame('b50ad385-829d-3141-a216-7e7d7539ba7f', Uuid::offline('Notch'));
    }

    public function test_normalizes_undashed_uuids(): void
    {
        $this->assertSame('069a79f4-44e9-4726-a5be-fca90e38aaf5', Uuid::normalize('069A79F444E94726A5BEFCA90E38AAF5'));
        $this->assertTrue(Uuid::isValid('069a79f4-44e9-4726-a5be-fca90e38aaf5'));
        $this->assertFalse(Uuid::isValid('../../etc/passwd'));
    }
}
