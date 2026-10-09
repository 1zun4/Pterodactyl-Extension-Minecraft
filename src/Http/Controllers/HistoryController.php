<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Minecraft\Models\ServerOptions;
use Minecraft\Services\PlayerHistory;
use Pterodactyl\Models\Server;

final class HistoryController extends Controller
{
    public function __construct(private readonly PlayerHistory $history) {}

    public function show(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'players-read');

        return $this->response($server);
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'players-moderate');

        $options = ServerOptions::forServer($server->id);
        $options->history = $request->validate(['enabled' => ['required', 'boolean']])['enabled'];
        $options->save();

        if ($options->history) {
            $this->history->sample($server);
        }

        return $this->response($server);
    }

    private function response(Server $server): JsonResponse
    {
        return new JsonResponse([
            'enabled' => ServerOptions::forServer($server->id)->history,
            'days' => PlayerHistory::DAYS,
            'hours' => $this->history->hours($server),
        ]);
    }
}
