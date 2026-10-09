<?php

declare(strict_types=1);

namespace Minecraft\Services;

use DateTimeImmutable;
use Illuminate\Support\Facades\Http;
use Minecraft\Panel\Panel;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Extensions\ExtensionSettingsRegistry;
use RuntimeException;
use Throwable;

final readonly class LogFiles
{
    public const array DIRECTORIES = ['logs', 'crash-reports'];

    /** Files the running server still writes to. */
    private const array ACTIVE = ['latest.log', 'debug.log'];

    private const int READ_MAX_BYTES = 20 * 1024 * 1024;

    private const int UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

    private const int UPLOAD_MAX_LINES = 25_000;

    public function __construct(private Panel $panel, private ExtensionSettingsRegistry $settings) {}

    /** @return list<array{path: string, directory: string, name: string, size: int, modified: string|null}> */
    public function all(Server $server): array
    {
        $files = [];

        foreach (self::DIRECTORIES as $directory) {
            foreach ($this->panel->list($server, $directory) as $entry) {
                if ($entry['file']) {
                    $files[] = ['path' => "{$directory}/{$entry['name']}", 'directory' => $directory, 'name' => $entry['name'], 'size' => $entry['size'], 'modified' => $entry['modified']];
                }
            }
        }

        usort($files, static fn (array $a, array $b): int => strcmp((string) $b['modified'], (string) $a['modified']));

        return $files;
    }

    /** @return list<array{path: string, directory: string, name: string, size: int, modified: string|null}> */
    public function stale(Server $server, int $days, bool $logs, bool $crashes): array
    {
        $cutoff = (new DateTimeImmutable())->modify("-{$days} days");

        return array_values(array_filter($this->all($server), static function (array $file) use ($cutoff, $logs, $crashes): bool {
            $wanted = ! str_starts_with($file['name'], 'archive-') && (
                ($logs && $file['directory'] === 'logs' && ! in_array($file['name'], self::ACTIVE, true))
                || ($crashes && $file['directory'] === 'crash-reports')
            );

            return $wanted && $file['modified'] !== null && new DateTimeImmutable($file['modified']) < $cutoff;
        }));
    }

    /**
     * @param  list<array{path: string, directory: string, name: string}>  $files
     * @return list<string> Archives that were created.
     */
    public function remove(Server $server, array $files, bool $archive): array
    {
        $archives = [];

        foreach (self::DIRECTORIES as $directory) {
            $names = array_values(array_map(static fn (array $file): string => $file['name'], array_filter($files, static fn (array $file): bool => $file['directory'] === $directory)));

            if ($names === []) {
                continue;
            }

            if ($archive) {
                $archives[] = "{$directory}/".$this->panel->compress($server, "/{$directory}", $names);
            }

            $this->panel->delete($server, "/{$directory}", $names);
        }

        return $archives;
    }

    /** Uploads the console or a log file to mclo.gs and returns the share URL. */
    public function share(Server $server, ?string $path): string
    {
        $content = $path === null
            ? implode("\n", $this->panel->consoleLines($server))
            : $this->panel->read($server, $path, self::READ_MAX_BYTES);

        if ($content !== null && str_ends_with((string) $path, '.gz')) {
            $content = @gzdecode($content, 8 * self::UPLOAD_MAX_BYTES);
        }

        if (! is_string($content) || mb_trim($content) === '') {
            throw new RuntimeException('There is nothing to share yet.');
        }

        $content = (string) preg_replace('/\e\[[0-9;?]*[A-Za-z]/', '', $content);
        $lines = array_slice(preg_split('/\r\n|\n/', $content) ?: [], -self::UPLOAD_MAX_LINES);
        $content = mb_substr(implode("\n", $lines), -self::UPLOAD_MAX_BYTES, null, '8bit');

        $endpoint = (string) ($this->settings->get('minecraft')?->get('mclogs_url') ?: 'https://api.mclo.gs/1/log');

        try {
            $response = Http::asForm()->timeout(20)->post($endpoint, ['content' => $content])->json();
        } catch (Throwable) {
            throw new RuntimeException('mclo.gs could not be reached.');
        }

        if (! is_array($response) || ($response['success'] ?? false) !== true || ! is_string($response['url'] ?? null)) {
            throw new RuntimeException('mclo.gs rejected the upload: '.(is_array($response) ? (string) ($response['error'] ?? 'unknown error') : 'unknown error'));
        }

        return $response['url'];
    }
}
