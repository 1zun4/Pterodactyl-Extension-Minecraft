<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Minecraft\Panel\Panel;
use Pterodactyl\Models\Server;

final class MetaController extends Controller
{
    private const string PROXY_PATTERN = '/bungee|waterfall|velocity|flamecord|travertine|lightfall/i';

    public function __construct(private readonly Panel $panel) {}

    public function show(Server $server): JsonResponse
    {
        $hints = $server->egg->name.' '.$server->image.' '.($this->panel->variable($server, 'SERVER_JARFILE') ?? '');

        return new JsonResponse(['proxy' => preg_match(self::PROXY_PATTERN, $hints) === 1]);
    }
}
