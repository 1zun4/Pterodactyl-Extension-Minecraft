<?php

declare(strict_types=1);

namespace Minecraft\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Player counts summed per server and hour (UTC).
 *
 * @property int $server_id
 * @property string $hour
 * @property int $samples
 * @property int $total
 * @property int $peak
 */
final class PlayerSample extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $table = 'ext_minecraft_samples';

    protected $fillable = ['server_id', 'hour', 'samples', 'total', 'peak'];
}
