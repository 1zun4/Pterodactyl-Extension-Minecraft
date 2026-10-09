<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Minecraft\Query\ServerStatus;
use Minecraft\Services\ServerFiles;
use Pterodactyl\Models\Server;

final class StatusController extends Controller
{
    public function __construct(private readonly ServerStatus $status, private readonly ServerFiles $files) {}

    public function show(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'players-read');
        $status = $this->status->read($server, $this->files->properties($server), $request->boolean('fresh'));

        return new JsonResponse(['online' => $status['online'], 'players' => $status['players'], 'max' => $status['max'], 'version' => $status['version'], 'motd' => $status['motd']]);
    }
}
