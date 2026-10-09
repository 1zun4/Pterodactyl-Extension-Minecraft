<?php

declare(strict_types=1);

namespace Minecraft;

use Illuminate\Console\Scheduling\Schedule;
use Minecraft\Console\CleanLogsCommand;
use Minecraft\Console\PruneHistoryCommand;
use Minecraft\Console\SamplePlayersCommand;
use Minecraft\Panel\Panel;
use Pterodactyl\Extensions\ExtensionProvider;
use Pterodactyl\Services\Extensions\ExtensionSettingDefinition;
use Pterodactyl\Services\Extensions\ExtensionSettingsDefinition;

class MinecraftProvider extends ExtensionProvider
{
    public const array ITEM_ICONS = [
        'https://mc.nerothe.com/img/1.21.11/minecraft_{name}.png',
        'https://assets.mcasset.cloud/latest/assets/minecraft/textures/item/{name}.png',
        'https://assets.mcasset.cloud/latest/assets/minecraft/textures/block/{name}.png',
    ];

    public function register(): void
    {
        $this->app->scoped(Panel::class);
    }

    public function boot(): void
    {
        $this->registerApiRoutes();
        $this->loadExtensionMigrations();

        $this->registerPermissions('Minecraft server tools.', [
            'properties-read' => 'View server.properties.',
            'properties-update' => 'Change server.properties.',
            'players-read' => 'View players, inventories, statistics and history.',
            'players-manage' => 'Message, teleport, heal, give items and change game modes.',
            'players-moderate' => 'Kick, ban, whitelist, op and wipe players.',
            'logs-share' => 'Upload logs to mclo.gs.',
            'logs-clean' => 'Delete old logs and crash reports.',
        ]);

        $this->registerSettings(new ExtensionSettingsDefinition($this->settings(), [
            ExtensionSettingDefinition::make('avatar_url', 'avatar_url', 'https://mc-heads.net/avatar/{uuid}/{size}', ['required', 'string', 'max:255'])
                ->label('Player head URL')
                ->help('Image URL for player heads. {uuid}, {name} and {size} are replaced.')
                ->frontend()
                ->frontendType('string'),
            ExtensionSettingDefinition::make('item_icons', 'item_icons', self::ITEM_ICONS, [])
                ->label('Item icon URLs')
                ->help('Tried in order for every inventory slot. {name} is the item id without "minecraft:".')
                ->list(['url', 'max:255'], 5)
                ->frontend(),
            ExtensionSettingDefinition::make('uuid_lookup', 'uuid_lookup', true, ['boolean'])
                ->label('Look up UUIDs at Mojang')
                ->help('Needed to whitelist, op or ban players that never joined while the server is offline.')
                ->field('toggle'),
            ExtensionSettingDefinition::make('query_host', 'query_host', '', ['nullable', 'string', 'max:255'])
                ->label('Query host')
                ->help('Host the Panel uses to reach game servers for player counts. Leave empty to use the allocation address.'),
            ExtensionSettingDefinition::make('mclogs_url', 'mclogs_url', 'https://api.mclo.gs/1/log', ['required', 'url', 'max:255'])
                ->label('mclo.gs API')
                ->help('Endpoint for sharing logs. Change it for a self-hosted mclo.gs.'),
        ]));

        $this->registerCommands([SamplePlayersCommand::class, CleanLogsCommand::class, PruneHistoryCommand::class]);

        $this->registerSchedule(static function (Schedule $schedule): void {
            $schedule->command('minecraft:sample-players')->everyFiveMinutes()->withoutOverlapping()->runInBackground();
            $schedule->command('minecraft:clean-logs')->dailyAt('04:10')->withoutOverlapping()->runInBackground();
            $schedule->command('minecraft:prune-history')->dailyAt('04:40');
        });
    }
}
