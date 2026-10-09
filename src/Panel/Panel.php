<?php

declare(strict_types=1);

namespace Minecraft\Panel;

use Pterodactyl\Contracts\Files\CompressesFiles;
use Pterodactyl\Contracts\Files\DeletesFiles;
use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Contracts\Files\ReadsFileContents;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Contracts\Servers\ReadsServerLogs;
use Pterodactyl\Contracts\Servers\SendsServerCommands;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Facades\Daemon;
use Pterodactyl\Models\Server;

/**
 * The only place this extension touches Panel internals. Bound per request, so directory listings are cached.
 */
final class Panel
{
    /** @var array<string, list<array{name: string, size: int, file: bool, modified: string|null}>> */
    private array $listings = [];

    public function __construct(
        private readonly ReadsFileContents $reader,
        private readonly WritesFileContents $writer,
        private readonly ListsDirectories $lister,
        private readonly DeletesFiles $deleter,
        private readonly CompressesFiles $compressor,
        private readonly SendsServerCommands $commands,
        private readonly ReadsServerLogs $logs,
    ) {}

    /** Returns null when the file does not exist. */
    public function read(Server $server, string $path, int $maxBytes): ?string
    {
        return $this->exists($server, $path) ? $this->reader->read($server, $path, $maxBytes) : null;
    }

    public function exists(Server $server, string $path): bool
    {
        $path = mb_trim($path, '/');

        if ($path === '') {
            return true;
        }

        return in_array(basename($path), array_column($this->list($server, self::parent($path)), 'name'), true);
    }

    /** @return array<string, mixed>|list<mixed>|null */
    public function readJson(Server $server, string $path, int $maxBytes = 4 * 1024 * 1024): ?array
    {
        $contents = $this->read($server, $path, $maxBytes);
        $decoded = $contents === null ? null : json_decode($contents, true);

        return is_array($decoded) ? $decoded : null;
    }

    public function write(Server $server, string $path, string $contents): void
    {
        $this->writer->write($server, $path, $contents);
        $this->forget($server, self::parent(mb_trim($path, '/')));
        Activity::event('server:file.write')->subject($server)->property('file', '/'.mb_ltrim($path, '/'))->log();
    }

    /** @param array<array-key, mixed> $data */
    public function writeJson(Server $server, string $path, array $data): void
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $this->write($server, $path, (string) preg_replace_callback('/^ +/m', static fn (array $m): string => str_repeat(' ', intdiv(mb_strlen($m[0]), 2)), $json)."\n");
    }

    /**
     * Lists a directory, or returns an empty list when it does not exist.
     *
     * @return list<array{name: string, size: int, file: bool, modified: string|null}>
     */
    public function list(Server $server, string $directory): array
    {
        $directory = mb_trim($directory, '/');
        $key = $server->uuid.':'.$directory;

        if (isset($this->listings[$key])) {
            return $this->listings[$key];
        }

        try {
            $entries = $this->lister->list($server, '/'.$directory);
        } catch (DaemonConnectionException $exception) {
            // Wings answers 500 for missing directories, so check the parent before treating it as an error.
            if ($directory !== '' && ! $this->exists($server, $directory)) {
                return $this->listings[$key] = [];
            }

            throw $exception;
        }

        return $this->listings[$key] = array_map(static fn (array $entry): array => [
            'name' => (string) ($entry['name'] ?? ''),
            'size' => (int) ($entry['size'] ?? 0),
            'file' => (bool) ($entry['file'] ?? false),
            'modified' => isset($entry['modified']) ? (string) $entry['modified'] : null,
        ], $entries);
    }

    /** @param list<string> $files */
    public function delete(Server $server, string $root, array $files): void
    {
        if ($files === []) {
            return;
        }

        $this->deleter->delete($server, $root, $files);
        $this->forget($server, $root);
        Activity::event('server:file.delete')->subject($server)->property('directory', $root)->property('files', $files)->log();
    }

    /**
     * @param  list<string>  $files
     * @return string The archive's file name.
     */
    public function compress(Server $server, string $root, array $files): string
    {
        $archive = $this->compressor->compress($server, $root, $files);
        $this->forget($server, $root);
        Activity::event('server:file.compress')->subject($server)->property('directory', $root)->property('files', $files)->log();

        return (string) ($archive['name'] ?? '');
    }

    public function command(Server $server, string $command): void
    {
        $this->commands->send($server, $command);
        Activity::event('server:console.command')->subject($server)->property('command', $command)->log();
    }

    /** @return list<string> */
    public function consoleLines(Server $server): array
    {
        return $this->logs->read($server, ReadsServerLogs::MAX_LINES);
    }

    public function isRunning(Server $server): bool
    {
        try {
            return (Daemon::server($server)->details()['state'] ?? 'offline') === 'running';
        } catch (DaemonConnectionException) {
            return false;
        }
    }

    public function variable(Server $server, string $name): ?string
    {
        $variable = $server->variables()->where('env_variable', $name)->first();

        return $variable === null ? null : (string) ($variable->server_value ?? $variable->default_value);
    }

    private static function parent(string $path): string
    {
        $parent = dirname($path);

        return $parent === '.' ? '' : $parent;
    }

    private function forget(Server $server, string $directory): void
    {
        unset($this->listings[$server->uuid.':'.mb_trim($directory, '/')]);
    }
}
