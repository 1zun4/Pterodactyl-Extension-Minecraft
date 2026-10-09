<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Minecraft\Panel\Panel;
use Minecraft\Query\ServerStatus;
use Minecraft\Services\ServerFiles;
use Minecraft\Support\Nbt;
use Minecraft\Support\PlayerData;
use Minecraft\Support\PlayerDirectory;
use Minecraft\Support\Uuid;
use Pterodactyl\Models\Server;
use Throwable;

final class PlayerController extends Controller
{
    private const int PLAYER_DATA_MAX_BYTES = 2 * 1024 * 1024;

    public function __construct(private readonly Panel $panel, private readonly ServerFiles $files, private readonly ServerStatus $status) {}

    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'players-read');

        $properties = $this->files->properties($server);
        $status = $this->status->read($server, $properties, $request->boolean('fresh'));
        $directories = $this->files->playerDirectories($server, $this->files->level($properties));
        $saved = array_values(array_filter(array_map(
            static fn (array $file): ?string => preg_match('/^([0-9a-f-]{36})\.dat$/i', $file['name'], $match) === 1 ? $match[1] : null,
            $this->panel->list($server, $directories['data']),
        )));

        return new JsonResponse([
            'status' => $status,
            'whitelist_enabled' => ($properties['white-list'] ?? 'false') === 'true',
            'online_mode' => ($properties['online-mode'] ?? 'true') === 'true',
            'players' => PlayerDirectory::build(
                $this->list($server, 'usercache.json'),
                $this->list($server, 'ops.json'),
                $this->list($server, 'whitelist.json'),
                $this->list($server, 'banned-players.json'),
                $saved,
                $status['names'],
            ),
            'banned_ips' => array_map(static fn (array $entry): array => [
                'ip' => (string) ($entry['ip'] ?? ''),
                'reason' => isset($entry['reason']) ? (string) $entry['reason'] : null,
                'created' => isset($entry['created']) ? (string) $entry['created'] : null,
            ], $this->list($server, 'banned-ips.json')),
        ]);
    }

    public function show(Request $request, Server $server, string $uuid): JsonResponse
    {
        $this->authorize($request, $server, 'players-read');
        abort_unless(Uuid::isValid($uuid), 404);

        $uuid = Uuid::normalize($uuid);
        $directories = $this->files->playerDirectories($server, $this->files->level($this->files->properties($server)));
        $data = null;

        try {
            $raw = $this->panel->read($server, "{$directories['data']}/{$uuid}.dat", self::PLAYER_DATA_MAX_BYTES);
            $data = $raw === null ? null : PlayerData::fromNbt(Nbt::decode($raw));
        } catch (Throwable $exception) {
            report($exception);
        }

        $stats = $this->panel->readJson($server, "{$directories['stats']}/{$uuid}.json") ?? [];
        $advancements = $this->panel->readJson($server, "{$directories['advancements']}/{$uuid}.json") ?? [];
        $saved = collect($this->panel->list($server, $directories['data']))->firstWhere('name', "{$uuid}.dat");

        return new JsonResponse([
            'uuid' => $uuid,
            'data' => $data,
            'statistics' => PlayerData::statistics($stats) + ['advancements' => PlayerData::completedAdvancements($advancements)],
            'saved_at' => $saved['modified'] ?? null,
        ]);
    }

    /** @return list<array<string, mixed>> */
    private function list(Server $server, string $file): array
    {
        $entries = $this->panel->readJson($server, $file) ?? [];

        return array_values(array_filter($entries, is_array(...)));
    }
}
