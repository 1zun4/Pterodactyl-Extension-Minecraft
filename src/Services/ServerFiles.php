<?php

declare(strict_types=1);

namespace Minecraft\Services;

use Minecraft\Panel\Panel;
use Minecraft\Support\Properties;
use Pterodactyl\Models\Server;

final readonly class ServerFiles
{
    public const string PROPERTIES = 'server.properties';

    public const int PROPERTIES_MAX_BYTES = 256 * 1024;

    public function __construct(private Panel $panel) {}

    public function rawProperties(Server $server): ?string
    {
        return $this->panel->read($server, self::PROPERTIES, self::PROPERTIES_MAX_BYTES);
    }

    /** @return array<string, string> */
    public function properties(Server $server): array
    {
        return Properties::parse($this->rawProperties($server) ?? '');
    }

    /**
     * Minecraft 26.1 moved player files from the world root into players/.
     *
     * @return array{data: string, stats: string, advancements: string}
     */
    public function playerDirectories(Server $server, string $level): array
    {
        $base = $this->panel->exists($server, "{$level}/players") ? "{$level}/players" : $level;

        return [
            'data' => $base === $level ? "{$level}/playerdata" : "{$base}/data",
            'stats' => "{$base}/stats",
            'advancements' => "{$base}/advancements",
        ];
    }

    /** @param array<string, string> $properties */
    public function level(array $properties): string
    {
        $level = mb_trim($properties['level-name'] ?? '', " \t/");

        return $level !== '' && preg_match('#^[\w .\-/]+$#u', $level) === 1 && ! str_contains($level, '..') ? $level : 'world';
    }
}
