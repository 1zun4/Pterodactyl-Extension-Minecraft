<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use Minecraft\Support\PlayerDirectory;
use PHPUnit\Framework\TestCase;

final class PlayerDirectoryTest extends TestCase
{
    public function test_merges_all_lists_into_one_entry_per_player(): void
    {
        $players = PlayerDirectory::build(
            usercache: [['name' => 'Alex', 'uuid' => 'ec561538-f3fd-461d-aff5-086b22154bce', 'expiresOn' => '2026-11-01 10:00:00 +0000']],
            ops: [['name' => 'alex', 'uuid' => 'EC561538F3FD461DAFF5086B22154BCE', 'level' => 4]],
            whitelist: [['name' => 'Steve', 'uuid' => '8667ba71-b85a-4004-af54-457a9734eed7']],
            bans: [['name' => 'Griefer', 'uuid' => '00000000-0000-0000-0000-000000000001', 'reason' => 'Griefing']],
            savedUuids: ['11111111-1111-1111-1111-111111111111'],
            online: [['name' => 'Steve', 'uuid' => null], ['name' => 'Newbie', 'uuid' => null]],
        );

        $byName = array_column($players, null, 'name');

        $this->assertCount(5, $players);
        $this->assertTrue($byName['Alex']['operator']);
        $this->assertSame(4, $byName['Alex']['op_level']);
        $this->assertTrue($byName['Steve']['online'] && $byName['Steve']['whitelisted']);
        $this->assertSame('Griefing', $byName['Griefer']['ban_reason']);
        $this->assertNull($byName['Newbie']['uuid']);
        $this->assertSame('11111111-1111-1111-1111-111111111111', $byName['11111111-1111-1111-1111-111111111111']['uuid']);
        $this->assertSame(['Newbie', 'Steve'], [$players[0]['name'], $players[1]['name']]);
    }
}
