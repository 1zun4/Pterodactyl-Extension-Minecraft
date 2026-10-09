<?php

declare(strict_types=1);

namespace Minecraft\Query;

use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Extensions\ExtensionSettingsRegistry;
use Throwable;

/**
 * Live player count and names for a server, from the query protocol when enabled and the status ping otherwise.
 */
final readonly class ServerStatus
{
    private const int CACHE_SECONDS = 15;

    public function __construct(private ExtensionSettingsRegistry $settings) {}

    /**
     * @param  array<string, string>  $properties
     * @return array{online: bool, players: int, max: int, version: string|null, motd: string|null, names: list<array{name: string, uuid: string|null}>, source: string}
     */
    public function read(Server $server, array $properties = [], bool $fresh = false): array
    {
        if ($fresh) {
            $this->forget($server);
        }

        return Cache::remember(self::key($server), self::CACHE_SECONDS, fn (): array => $this->query($server, $properties));
    }

    public function forget(Server $server): void
    {
        Cache::forget(self::key($server));
    }

    private static function key(Server $server): string
    {
        return "ext:minecraft:status:{$server->uuid}";
    }

    private static function plainText(mixed $component): ?string
    {
        if (is_string($component)) {
            return mb_trim((string) preg_replace('/§./u', '', $component));
        }

        if (! is_array($component)) {
            return null;
        }

        $text = (string) ($component['text'] ?? '');

        foreach ($component['extra'] ?? [] as $child) {
            $text .= self::plainText($child) ?? '';
        }

        return mb_trim((string) preg_replace('/§./u', '', $text));
    }

    /**
     * @param  array<string, string>  $properties
     * @return array{online: bool, players: int, max: int, version: string|null, motd: string|null, names: list<array{name: string, uuid: string|null}>, source: string}
     */
    private function query(Server $server, array $properties): array
    {
        $host = $this->host($server);
        $port = (int) $server->allocation->port;
        $result = ['online' => false, 'players' => 0, 'max' => 0, 'version' => null, 'motd' => null, 'names' => [], 'source' => 'none'];

        try {
            $status = ServerListPing::ping($host, $port);
            $result = [
                'online' => true,
                'players' => (int) ($status['players']['online'] ?? 0),
                'max' => (int) ($status['players']['max'] ?? 0),
                'version' => isset($status['version']['name']) ? (string) $status['version']['name'] : null,
                'motd' => self::plainText($status['description'] ?? null),
                'names' => array_values(array_map(
                    static fn (array $player): array => ['name' => (string) ($player['name'] ?? ''), 'uuid' => isset($player['id']) ? (string) $player['id'] : null],
                    array_filter($status['players']['sample'] ?? [], static fn (mixed $player): bool => is_array($player) && isset($player['name']) && $player['name'] !== 'Anonymous Player'),
                )),
                'source' => 'ping',
            ];
        } catch (Throwable) {
            return $result;
        }

        if (($properties['enable-query'] ?? 'false') !== 'true' || $result['players'] === 0) {
            return $result;
        }

        try {
            $query = GameSpyQuery::query($host, (int) ($properties['query.port'] ?? $port));
            $result['names'] = array_map(static fn (string $name): array => ['name' => $name, 'uuid' => null], $query['players']);
            $result['source'] = 'query';
        } catch (Throwable) {
        }

        return $result;
    }

    private function host(Server $server): string
    {
        $override = (string) ($this->settings->get('minecraft')?->get('query_host') ?? '');

        if ($override !== '') {
            return $override;
        }

        $allocation = $server->allocation;
        $ip = $allocation->ip_alias ?: $allocation->ip;

        return in_array($ip, ['0.0.0.0', '::'], true) ? $server->node->fqdn : $ip;
    }
}
