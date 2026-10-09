<?php

declare(strict_types=1);

namespace Minecraft\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Minecraft\Support\Uuid;
use Pterodactyl\Services\Extensions\ExtensionSettingsRegistry;
use Throwable;

final readonly class UuidResolver
{
    public function __construct(private ExtensionSettingsRegistry $settings) {}

    /**
     * @param  list<array<string, mixed>>  $usercache
     * @param  array<string, string>  $properties
     */
    public function resolve(string $name, array $usercache, array $properties): ?string
    {
        foreach ($usercache as $entry) {
            if (mb_strtolower((string) ($entry['name'] ?? '')) === mb_strtolower($name) && Uuid::isValid((string) ($entry['uuid'] ?? ''))) {
                return Uuid::normalize((string) $entry['uuid']);
            }
        }

        if (($properties['online-mode'] ?? 'true') === 'false') {
            return Uuid::offline($name);
        }

        if (! $this->settings->get('minecraft')?->get('uuid_lookup')) {
            return null;
        }

        return Cache::remember('ext:minecraft:uuid:'.mb_strtolower($name), 86400, static function () use ($name): ?string {
            try {
                $id = Http::timeout(5)->get('https://api.minecraftservices.com/minecraft/profile/lookup/name/'.rawurlencode($name))->json('id');
            } catch (Throwable) {
                return null;
            }

            return is_string($id) && Uuid::isValid($id) ? Uuid::normalize($id) : null;
        });
    }
}
