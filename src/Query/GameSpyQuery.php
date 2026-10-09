<?php

declare(strict_types=1);

namespace Minecraft\Query;

use RuntimeException;

/**
 * The UDP query protocol (enable-query in server.properties). Unlike the status ping it returns every player name.
 */
final class GameSpyQuery
{
    /** @return array{info: array<string, string>, players: list<string>} */
    public static function query(string $host, int $port, float $timeout = 2.0): array
    {
        $socket = @stream_socket_client("udp://{$host}:{$port}", $code, $message, $timeout);

        if ($socket === false) {
            throw new RuntimeException("Could not open a query socket to {$host}:{$port}: {$message}");
        }

        try {
            stream_set_timeout($socket, 0, (int) ($timeout * 1_000_000));
            $session = random_int(0, 0x7FFFFFFF) & 0x0F0F0F0F;

            fwrite($socket, "\xFE\xFD\x09".pack('N', $session));
            $handshake = self::receive($socket);
            $token = (int) mb_rtrim(mb_substr($handshake, 5, null, '8bit'), "\0");

            fwrite($socket, "\xFE\xFD\x00".pack('N', $session).pack('N', $token & 0xFFFFFFFF)."\x00\x00\x00\x00");

            return self::parse(mb_substr(self::receive($socket), 16, null, '8bit'));
        } finally {
            fclose($socket);
        }
    }

    /** @return array{info: array<string, string>, players: list<string>} */
    public static function parse(string $body): array
    {
        [$infoPart, $playerPart] = array_pad(explode("\x00\x00\x01player_\x00\x00", $body, 2), 2, '');

        $fields = explode("\x00", $infoPart);
        $info = [];

        for ($i = 0; $i + 1 < count($fields); $i += 2) {
            if ($fields[$i] !== '') {
                $info[$fields[$i]] = $fields[$i + 1];
            }
        }

        $players = array_values(array_filter(explode("\x00", $playerPart), static fn (string $name): bool => $name !== ''));

        return ['info' => $info, 'players' => $players];
    }

    /** @param resource $socket */
    private static function receive($socket): string
    {
        $data = fread($socket, 8192);

        if ($data === false || $data === '' || stream_get_meta_data($socket)['timed_out']) {
            throw new RuntimeException('The server did not answer the query.');
        }

        return $data;
    }
}
