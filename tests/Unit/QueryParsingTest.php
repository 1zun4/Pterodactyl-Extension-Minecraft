<?php

declare(strict_types=1);

namespace Minecraft\Tests\Unit;

use Minecraft\Query\GameSpyQuery;
use PHPUnit\Framework\TestCase;

final class QueryParsingTest extends TestCase
{
    public function test_parses_a_full_stat_response(): void
    {
        $body = "hostname\x00A Minecraft Server\x00numplayers\x002\x00maxplayers\x0020\x00\x00\x01player_\x00\x00Alex\x00Steve\x00\x00";

        $this->assertSame(
            ['info' => ['hostname' => 'A Minecraft Server', 'numplayers' => '2', 'maxplayers' => '20'], 'players' => ['Alex', 'Steve']],
            GameSpyQuery::parse($body),
        );
    }
}
