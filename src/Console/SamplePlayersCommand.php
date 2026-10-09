<?php

declare(strict_types=1);

namespace Minecraft\Console;

use Illuminate\Console\Command;
use Minecraft\Models\ServerOptions;
use Minecraft\Services\PlayerHistory;
use Pterodactyl\Models\Server;
use Throwable;

final class SamplePlayersCommand extends Command
{
    protected $signature = 'minecraft:sample-players';

    protected $description = 'Record the player count of servers with player history enabled.';

    public function handle(PlayerHistory $history): int
    {
        $ids = ServerOptions::query()->where('history', true)->pluck('server_id');

        Server::query()->whereIn('id', $ids)->with(['allocation', 'node'])->each(function (Server $server) use ($history): void {
            try {
                $history->sample($server);
            } catch (Throwable $exception) {
                $this->warn("{$server->uuid}: {$exception->getMessage()}");
            }
        });

        return self::SUCCESS;
    }
}
