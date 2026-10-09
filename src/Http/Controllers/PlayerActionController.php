<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Minecraft\Panel\Panel;
use Minecraft\Query\ServerStatus;
use Minecraft\Services\ServerFiles;
use Minecraft\Services\UuidResolver;
use Minecraft\Support\PlayerLists;
use Minecraft\Support\Properties;
use Minecraft\Support\Uuid;
use Pterodactyl\Models\Server;

final class PlayerActionController extends Controller
{
    private const array PERMISSIONS = [
        'message' => 'players-manage',
        'teleport' => 'players-manage',
        'gamemode' => 'players-manage',
        'kill' => 'players-manage',
        'give' => 'players-manage',
        'effect' => 'players-manage',
        'clear-effects' => 'players-manage',
        'clear-inventory' => 'players-manage',
        'save' => 'players-manage',
        'kick' => 'players-moderate',
        'ban' => 'players-moderate',
        'pardon' => 'players-moderate',
        'ban-ip' => 'players-moderate',
        'pardon-ip' => 'players-moderate',
        'whitelist-add' => 'players-moderate',
        'whitelist-remove' => 'players-moderate',
        'whitelist-enabled' => 'players-moderate',
        'op' => 'players-moderate',
        'deop' => 'players-moderate',
        'wipe' => 'players-moderate',
    ];

    /** Actions that only make sense while the server runs. */
    private const array LIVE_ONLY = ['message', 'teleport', 'gamemode', 'kill', 'give', 'effect', 'clear-effects', 'clear-inventory', 'save', 'kick'];

    private const string NAME = '/^\.?[A-Za-z0-9_]{1,16}$/';

    private const string RESOURCE = '/^([a-z0-9_.-]+:)?[a-z0-9_.\/-]+$/';

    private const string COORDINATE = '/^(~|\^)?-?\d{0,8}(\.\d+)?$/';

    public function __construct(
        private readonly Panel $panel,
        private readonly ServerFiles $files,
        private readonly ServerStatus $status,
        private readonly UuidResolver $uuids,
    ) {}

    public function store(Request $request, Server $server): JsonResponse
    {
        $action = (string) $request->validate(['action' => ['required', 'string', Rule::in(array_keys(self::PERMISSIONS))]])['action'];
        $this->authorize($request, $server, self::PERMISSIONS[$action]);

        $data = $request->validate($this->rules($action));
        $running = $this->panel->isRunning($server);

        abort_if(in_array($action, self::LIVE_ONLY, true) && ! $running, 409, 'The server has to be running for this action.');

        $message = match ($action) {
            'wipe' => $this->wipe($server, $data),
            'whitelist-enabled' => $this->toggleWhitelist($server, (bool) $data['enabled'], $running),
            'ban', 'pardon', 'ban-ip', 'pardon-ip', 'whitelist-add', 'whitelist-remove', 'op', 'deop' => $running
                ? $this->send($server, $this->command($action, $data))
                : $this->editLists($server, $action, $data),
            default => $this->send($server, $this->command($action, $data)),
        };

        $this->status->forget($server);

        return new JsonResponse(['message' => $message]);
    }

    private static function clean(string $text): string
    {
        return mb_trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $text));
    }

    /** @return array<string, list<mixed>> */
    private function rules(string $action): array
    {
        $name = ['required', 'string', 'regex:'.self::NAME];
        $text = ['nullable', 'string', 'max:256'];

        return match ($action) {
            'message' => ['name' => $name, 'text' => ['required', 'string', 'max:256']],
            'teleport' => ['name' => $name, 'target' => ['nullable', 'string', 'regex:'.self::NAME], 'x' => ['required_without:target', 'nullable', 'string', 'regex:'.self::COORDINATE], 'y' => ['required_without:target', 'nullable', 'string', 'regex:'.self::COORDINATE], 'z' => ['required_without:target', 'nullable', 'string', 'regex:'.self::COORDINATE]],
            'gamemode' => ['name' => $name, 'mode' => ['required', Rule::in(['survival', 'creative', 'adventure', 'spectator'])]],
            'give' => ['name' => $name, 'item' => ['required', 'string', 'max:128', 'regex:'.self::RESOURCE], 'count' => ['required', 'integer', 'min:1', 'max:6400']],
            'effect' => ['name' => $name, 'effect' => ['required', 'string', 'max:128', 'regex:'.self::RESOURCE], 'seconds' => ['required', 'integer', 'min:1', 'max:1000000'], 'amplifier' => ['required', 'integer', 'min:0', 'max:255']],
            'kick', 'ban' => ['name' => $name, 'uuid' => ['nullable', 'string', 'regex:'.Uuid::PATTERN], 'reason' => $text],
            'ban-ip' => ['ip' => ['required', 'ip'], 'reason' => $text],
            'pardon-ip' => ['ip' => ['required', 'ip']],
            'whitelist-enabled' => ['enabled' => ['required', 'boolean']],
            'wipe' => ['name' => $name, 'uuid' => ['required', 'string', 'regex:'.Uuid::PATTERN], 'confirm' => ['required', 'string', 'same:name']],
            'save' => [],
            default => ['name' => $name, 'uuid' => ['nullable', 'string', 'regex:'.Uuid::PATTERN]],
        };
    }

    /** @param array<string, mixed> $data */
    private function command(string $action, array $data): string
    {
        $name = (string) ($data['name'] ?? '');
        $reason = self::clean((string) ($data['reason'] ?? ''));

        return mb_rtrim(match ($action) {
            'message' => "tell {$name} ".self::clean((string) $data['text']),
            'teleport' => isset($data['target']) && $data['target'] !== '' ? "tp {$name} {$data['target']}" : "tp {$name} {$data['x']} {$data['y']} {$data['z']}",
            'gamemode' => "gamemode {$data['mode']} {$name}",
            'kill' => "kill {$name}",
            'give' => "give {$name} {$data['item']} {$data['count']}",
            'effect' => "effect give {$name} {$data['effect']} {$data['seconds']} {$data['amplifier']}",
            'clear-effects' => "effect clear {$name}",
            'clear-inventory' => "clear {$name}",
            'save' => 'save-all',
            'kick' => "kick {$name} {$reason}",
            'ban' => "ban {$name} {$reason}",
            'pardon' => "pardon {$name}",
            'ban-ip' => "ban-ip {$data['ip']} {$reason}",
            'pardon-ip' => "pardon-ip {$data['ip']}",
            'whitelist-add' => "whitelist add {$name}",
            'whitelist-remove' => "whitelist remove {$name}",
            'op' => "op {$name}",
            'deop' => "deop {$name}",
        });
    }

    private function send(Server $server, string $command): string
    {
        $this->panel->command($server, $command);

        return "Sent \"{$command}\" to the console.";
    }

    /** @param array<string, mixed> $data */
    private function editLists(Server $server, string $action, array $data): string
    {
        $properties = $this->files->properties($server);
        $name = (string) ($data['name'] ?? '');
        $uuid = isset($data['uuid']) && $data['uuid'] !== '' ? Uuid::normalize((string) $data['uuid']) : null;

        if ($uuid === null && in_array($action, ['ban', 'whitelist-add', 'op'], true)) {
            $uuid = $this->uuids->resolve($name, $this->list($server, 'usercache.json'), $properties);
            abort_if($uuid === null, 422, "Could not find the UUID of {$name}. Start the server and try again.");
        }

        [$file, $list] = match ($action) {
            'ban' => ['banned-players.json', PlayerLists::put($this->list($server, 'banned-players.json'), PlayerLists::banEntry('uuid', (string) $uuid, $name, self::clean((string) ($data['reason'] ?? '')), new DateTimeImmutable()), 'uuid')],
            'pardon' => ['banned-players.json', PlayerLists::remove($this->list($server, 'banned-players.json'), $name, 'name')],
            'ban-ip' => ['banned-ips.json', PlayerLists::put($this->list($server, 'banned-ips.json'), PlayerLists::banEntry('ip', (string) $data['ip'], null, self::clean((string) ($data['reason'] ?? '')), new DateTimeImmutable()), 'ip')],
            'pardon-ip' => ['banned-ips.json', PlayerLists::remove($this->list($server, 'banned-ips.json'), (string) $data['ip'], 'ip')],
            'whitelist-add' => ['whitelist.json', PlayerLists::put($this->list($server, 'whitelist.json'), PlayerLists::whitelistEntry((string) $uuid, $name), 'uuid')],
            'whitelist-remove' => ['whitelist.json', PlayerLists::remove($this->list($server, 'whitelist.json'), $name, 'name')],
            'op' => ['ops.json', PlayerLists::put($this->list($server, 'ops.json'), PlayerLists::operatorEntry((string) $uuid, $name, (int) ($properties['op-permission-level'] ?? 4)), 'uuid')],
            'deop' => ['ops.json', PlayerLists::remove($this->list($server, 'ops.json'), $name, 'name')],
        };

        $this->panel->writeJson($server, $file, $list);

        return "Updated {$file}. It applies when the server starts.";
    }

    private function toggleWhitelist(Server $server, bool $enabled, bool $running): string
    {
        if ($running) {
            return $this->send($server, $enabled ? 'whitelist on' : 'whitelist off');
        }

        $this->panel->write($server, ServerFiles::PROPERTIES, Properties::patch($this->files->rawProperties($server) ?? '', ['white-list' => $enabled ? 'true' : 'false']));

        return 'Updated server.properties. It applies when the server starts.';
    }

    /** @param array<string, mixed> $data */
    private function wipe(Server $server, array $data): string
    {
        $properties = $this->files->properties($server);
        $name = (string) $data['name'];
        $online = $this->status->read($server, $properties, fresh: true)['names'];

        abort_if(
            collect($online)->contains(static fn (array $player): bool => mb_strtolower($player['name']) === mb_strtolower($name)),
            409,
            "{$name} is online. Kick them before wiping their data.",
        );

        $uuid = Uuid::normalize((string) $data['uuid']);
        $directories = $this->files->playerDirectories($server, $this->files->level($properties));
        $targets = [
            $directories['data'] => ["{$uuid}.dat", "{$uuid}.dat_old"],
            $directories['stats'] => ["{$uuid}.json"],
            $directories['advancements'] => ["{$uuid}.json"],
        ];

        foreach ($targets as $directory => $candidates) {
            $existing = array_column($this->panel->list($server, $directory), 'name');
            $this->panel->delete($server, "/{$directory}", array_values(array_intersect($candidates, $existing)));
        }

        return "Wiped the saved data of {$name}.";
    }

    /** @return list<array<string, mixed>> */
    private function list(Server $server, string $file): array
    {
        return array_values(array_filter($this->panel->readJson($server, $file) ?? [], is_array(...)));
    }
}
