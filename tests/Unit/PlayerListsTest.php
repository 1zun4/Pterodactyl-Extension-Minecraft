<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use DateTimeImmutable;
use Minecraft\Support\PlayerLists;
use PHPUnit\Framework\TestCase;

final class PlayerListsTest extends TestCase
{
    public function test_put_replaces_existing_entries(): void
    {
        $list = [['uuid' => 'a', 'name' => 'Alex'], ['uuid' => 'b', 'name' => 'Steve']];

        $this->assertSame(
            [['uuid' => 'b', 'name' => 'Steve'], ['uuid' => 'A', 'name' => 'Alex2']],
            PlayerLists::put($list, ['uuid' => 'A', 'name' => 'Alex2'], 'uuid'),
        );
        $this->assertSame([['uuid' => 'b', 'name' => 'Steve']], PlayerLists::remove($list, 'alex', 'name'));
    }

    public function test_ban_entries_match_the_server_format(): void
    {
        $this->assertSame(
            ['ip' => '1.2.3.4', 'created' => '2026-10-09 12:00:00 +0000', 'source' => 'Pterodactyl', 'expires' => 'forever', 'reason' => 'Banned by an operator.'],
            PlayerLists::banEntry('ip', '1.2.3.4', null, '', new DateTimeImmutable('2026-10-09 12:00:00 +0000')),
        );
    }
}
