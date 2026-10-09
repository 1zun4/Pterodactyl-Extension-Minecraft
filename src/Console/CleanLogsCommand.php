<?php

declare(strict_types=1);

namespace Minecraft\Console;

use Illuminate\Console\Command;
use Minecraft\Models\ServerOptions;
use Minecraft\Services\LogFiles;
use Pterodactyl\Models\Server;
use Throwable;

final class CleanLogsCommand extends Command
{
    protected $signature = 'minecraft:clean-logs';

    protected $description = 'Delete old log files and crash reports on servers with scheduled cleanup enabled.';

    public function handle(LogFiles $logs): int
    {
        ServerOptions::query()->where('cleanup', true)->each(function (ServerOptions $options) use ($logs): void {
            $server = Server::query()->find($options->server_id);

            if ($server === null || $server->isSuspended()) {
                return;
            }

            try {
                $files = $logs->stale($server, $options->cleanup_days, $options->cleanup_logs, $options->cleanup_crashes);
                $logs->remove($server, $files, $options->cleanup_archive);
                $this->info("{$server->uuid}: removed ".count($files).' files.');
            } catch (Throwable $exception) {
                $this->warn("{$server->uuid}: {$exception->getMessage()}");
            }
        });

        return self::SUCCESS;
    }
}
