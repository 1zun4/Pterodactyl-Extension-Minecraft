<?php

declare(strict_types=1);

namespace Minecraft\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Minecraft\Panel\Panel;
use Minecraft\Services\ServerFiles;
use Minecraft\Support\Properties;
use Pterodactyl\Models\Server;

final class PropertiesController extends Controller
{
    private const string KEY_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/';

    public function __construct(private readonly Panel $panel, private readonly ServerFiles $files) {}

    public function show(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'properties-read');
        $contents = $this->files->rawProperties($server);

        return $this->response($contents);
    }

    public function update(Request $request, Server $server): JsonResponse
    {
        $this->authorize($request, $server, 'properties-update');

        $values = $request->validate([
            'values' => ['required', 'array', 'min:1', 'max:200'],
            'values.*' => ['present', 'nullable', 'string', 'max:4096'],
        ])['values'];

        foreach (array_keys($values) as $key) {
            if (preg_match(self::KEY_PATTERN, (string) $key) !== 1) {
                throw ValidationException::withMessages(['values' => "\"{$key}\" is not a valid property name."]);
            }
        }

        $contents = Properties::patch($this->files->rawProperties($server) ?? '', array_map(static fn (?string $value): string => $value ?? '', $values));
        $this->panel->write($server, ServerFiles::PROPERTIES, $contents);

        return $this->response($contents);
    }

    private function response(?string $contents): JsonResponse
    {
        $properties = Properties::parse($contents ?? '');

        return new JsonResponse([
            'exists' => $contents !== null,
            'properties' => array_map(static fn (string $key, string $value): array => ['key' => $key, 'value' => $value], array_keys($properties), $properties),
        ]);
    }
}
