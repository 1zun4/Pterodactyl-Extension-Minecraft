<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Minecraft\Panel\Panel;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Extensions\ExtensionSettingsRegistry;

final class MetaController extends Controller
{
    private const string PROXY_PATTERN = '/bungee|waterfall|velocity|flamecord|travertine|lightfall/i';

    public function __construct(private readonly Panel $panel, private readonly ExtensionSettingsRegistry $settings) {}

    public function show(Server $server): JsonResponse
    {
        $hints = $server->egg->name.' '.$server->image.' '.($this->panel->variable($server, 'SERVER_JARFILE') ?? '');

        $hidden = in_array($server->egg_id, array_map(intval(...), (array) ($this->settings->get('minecraft')?->get('hidden_eggs') ?? [])), true);

        return new JsonResponse(['proxy' => preg_match(self::PROXY_PATTERN, $hints) === 1, 'hidden' => $hidden]);
    }
}
