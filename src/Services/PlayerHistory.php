<?php

declare(strict_types=1);

namespace Minecraft\Services;

use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\DB;
use Minecraft\Models\PlayerSample;
use Minecraft\Query\ServerStatus;
use Pterodactyl\Models\Server;

final readonly class PlayerHistory
{
    public const int DAYS = 28;

    public function __construct(private ServerStatus $status) {}

    public function sample(Server $server): void
    {
        $players = $this->status->read($server, fresh: true)['players'];
        $hour = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:00:00');

        DB::statement(
            'INSERT INTO ext_minecraft_samples (server_id, hour, samples, total, peak) VALUES (?, ?, 1, ?, ?)
             ON DUPLICATE KEY UPDATE samples = samples + 1, total = total + VALUES(total), peak = GREATEST(peak, VALUES(peak))',
            [$server->id, $hour, $players, $players],
        );
    }

    /** @return list<array{hour: string, average: float, peak: int}> */
    public function hours(Server $server): array
    {
        $since = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('-'.self::DAYS.' days')->format('Y-m-d H:00:00');

        return PlayerSample::query()
            ->where('server_id', $server->id)
            ->where('hour', '>=', $since)
            ->orderBy('hour')
            ->get()
            ->map(static fn (PlayerSample $sample): array => [
                'hour' => (new DateTimeImmutable($sample->hour, new DateTimeZone('UTC')))->format(DATE_ATOM),
                'average' => round($sample->total / max(1, $sample->samples), 2),
                'peak' => $sample->peak,
            ])
            ->values()
            ->all();
    }

    public function prune(): int
    {
        $before = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('-'.(self::DAYS + 7).' days')->format('Y-m-d H:00:00');

        return PlayerSample::query()->where('hour', '<', $before)->delete();
    }
}
