<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use Minecraft\Support\PlayerData;
use PHPUnit\Framework\TestCase;

final class PlayerDataTest extends TestCase
{
    public function test_reads_the_current_inventory_format(): void
    {
        $data = PlayerData::fromNbt([
            'Health' => 17.5,
            'foodLevel' => 18,
            'XpLevel' => 30,
            'playerGameType' => 1,
            'Dimension' => 'minecraft:the_nether',
            'Pos' => [107.94, 64.0, -127.81],
            'Inventory' => [
                ['Slot' => 0, 'id' => 'minecraft:diamond_sword', 'count' => 1, 'components' => ['minecraft:enchantments' => ['minecraft:sharpness' => 5], 'minecraft:custom_name' => '"Blade"']],
                ['Slot' => 9, 'id' => 'minecraft:cobblestone', 'count' => 64],
            ],
            'equipment' => ['head' => ['id' => 'minecraft:diamond_helmet', 'count' => 1], 'offhand' => ['id' => 'minecraft:shield', 'count' => 1]],
            'EnderItems' => [['Slot' => 26, 'id' => 'minecraft:emerald', 'count' => 3]],
        ]);

        $this->assertSame(['id' => 'minecraft:diamond_sword', 'count' => 1, 'name' => 'Blade', 'enchanted' => true, 'damage' => 0], $data['inventory']['hotbar'][0]);
        $this->assertSame('minecraft:cobblestone', $data['inventory']['main'][0]['id']);
        $this->assertSame('minecraft:diamond_helmet', $data['inventory']['armor']['head']['id']);
        $this->assertSame('minecraft:shield', $data['inventory']['offhand']['id']);
        $this->assertSame(3, $data['ender_chest'][26]['count']);
        $this->assertCount(27, $data['inventory']['main']);
        $this->assertSame([17.5, 18, 30, 'creative', 'the_nether', [107.9, 64.0, -127.8]], [$data['health'], $data['food'], $data['xp_level'], $data['game_mode'], $data['dimension'], $data['position']]);
    }

    public function test_reads_the_legacy_inventory_format(): void
    {
        $data = PlayerData::fromNbt([
            'Dimension' => -1,
            'Inventory' => [
                ['Slot' => 103, 'id' => 'minecraft:iron_helmet', 'Count' => 1, 'tag' => ['Damage' => 12, 'Enchantments' => [['id' => 'minecraft:unbreaking']]]],
                ['Slot' => -106, 'id' => 'minecraft:torch', 'Count' => 16],
            ],
        ]);

        $this->assertSame(['id' => 'minecraft:iron_helmet', 'count' => 1, 'name' => null, 'enchanted' => true, 'damage' => 12], $data['inventory']['armor']['head']);
        $this->assertSame(16, $data['inventory']['offhand']['count']);
        $this->assertSame('the_nether', $data['dimension']);
        $this->assertNull($data['position']);
    }

    public function test_reads_statistics_and_advancements(): void
    {
        $this->assertSame(
            ['play_time' => 72000, 'deaths' => 5, 'mob_kills' => 1, 'player_kills' => 0, 'distance_walked' => 3800],
            PlayerData::statistics(['stats' => ['minecraft:custom' => ['minecraft:play_time' => 72000, 'minecraft:deaths' => 5, 'minecraft:mob_kills' => 1, 'minecraft:walk_one_cm' => 3000, 'minecraft:sprint_one_cm' => 800]]]),
        );

        $this->assertSame(2, PlayerData::completedAdvancements([
            'minecraft:story/root' => ['done' => true],
            'minecraft:story/mine_stone' => ['done' => true],
            'minecraft:story/smelt_iron' => ['done' => false],
            'minecraft:recipes/misc/torch' => ['done' => true],
            'DataVersion' => 4189,
        ]));
    }
}
