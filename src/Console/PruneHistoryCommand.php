<?php

declare(strict_types=1);

namespace Minecraft\Console;

use Illuminate\Console\Command;
use Minecraft\Services\PlayerHistory;

final class PruneHistoryCommand extends Command
{
    protected $signature = 'minecraft:prune-history';

    protected $description = 'Delete player history older than the heatmap shows.';

    public function handle(PlayerHistory $history): int
    {
        $this->info("Deleted {$history->prune()} samples.");

        return self::SUCCESS;
    }
}
