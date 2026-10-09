<?php

declare(strict_types=1);

namespace Minecraft\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $server_id
 * @property bool $history
 * @property bool $cleanup
 * @property int $cleanup_days
 * @property bool $cleanup_logs
 * @property bool $cleanup_crashes
 * @property bool $cleanup_archive
 */
final class ServerOptions extends Model
{
    public $incrementing = false;

    protected $table = 'ext_minecraft_options';

    protected $primaryKey = 'server_id';

    protected $fillable = ['server_id', 'history', 'cleanup', 'cleanup_days', 'cleanup_logs', 'cleanup_crashes', 'cleanup_archive'];

    protected $attributes = [
        'history' => false,
        'cleanup' => false,
        'cleanup_days' => 14,
        'cleanup_logs' => true,
        'cleanup_crashes' => true,
        'cleanup_archive' => false,
    ];

    protected function casts(): array
    {
        return [
            'history' => 'boolean',
            'cleanup' => 'boolean',
            'cleanup_days' => 'integer',
            'cleanup_logs' => 'boolean',
            'cleanup_crashes' => 'boolean',
            'cleanup_archive' => 'boolean',
        ];
    }

    public static function forServer(int $serverId): self
    {
        return self::query()->firstOrNew(['server_id' => $serverId]);
    }
}
