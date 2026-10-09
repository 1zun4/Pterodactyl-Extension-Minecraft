<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Minecraft\Models\ServerOptions;
use Minecraft\Services\LogFiles;
use Pterodactyl\Models\Server;
use RuntimeException;

final class LogController extends Controller
{
    private const string PATH = '#^(logs|crash-reports)/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$#';

    public function __construct(private readonly LogFiles $logs) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        abort_unless(
            $request->user()?->can('ext.minecraft.logs-share', $server) || $request->user()?->can('ext.minecraft.logs-clean', $server),
            403,
            'You do not have permission to do that.',
        );

        return new JsonResponse(['files' => $this->logs->all($server), 'schedule' => $this->schedule($server)]);
    }

    public function share(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'logs-share');
        $path = $request->validate(['path' => ['nullable', 'string', 'regex:'.self::PATH]])['path'] ?? null;

        try {
            return new JsonResponse(['url' => $this->logs->share($server, $path)]);
        } catch (RuntimeException $exception) {
            abort(422, $exception->getMessage());
        }
    }

    public function clean(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'logs-clean');

        $data = $request->validate([
            'days' => ['required', 'integer', 'min:0', 'max:3650'],
            'logs' => ['required', 'boolean'],
            'crashes' => ['required', 'boolean'],
            'archive' => ['required', 'boolean'],
            'dry_run' => ['required', 'boolean'],
        ]);

        $files = $this->logs->stale($server, (int) $data['days'], (bool) $data['logs'], (bool) $data['crashes']);
        $archives = $data['dry_run'] ? [] : $this->logs->remove($server, $files, (bool) $data['archive']);

        return new JsonResponse(['files' => $files, 'archives' => $archives]);
    }

    public function updateSchedule(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'logs-clean');

        $options = ServerOptions::forServer($server->id);
        $options->fill($request->validate([
            'cleanup' => ['required', 'boolean'],
            'cleanup_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'cleanup_logs' => ['required', 'boolean'],
            'cleanup_crashes' => ['required', 'boolean'],
            'cleanup_archive' => ['required', 'boolean'],
        ]))->save();

        return new JsonResponse(['schedule' => $this->schedule($server)]);
    }

    /** @return array<string, bool|int> */
    private function schedule(Server $server): array
    {
        return ServerOptions::forServer($server->id)->only(['cleanup', 'cleanup_days', 'cleanup_logs', 'cleanup_crashes', 'cleanup_archive']);
    }
}
