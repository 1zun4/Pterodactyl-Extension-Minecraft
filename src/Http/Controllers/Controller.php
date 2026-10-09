<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;

abstract class Controller
{
    protected function authorize(Request $request, Server $server, string $permission): void
    {
        abort_unless((bool) $request->user()?->can("ext.minecraft.{$permission}", $server), 403, 'You do not have permission to do that.');
    }
}
