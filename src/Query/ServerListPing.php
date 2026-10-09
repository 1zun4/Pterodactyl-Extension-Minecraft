<?php

declare(strict_types=1);

namespace Minecraft\Query;

use RuntimeException;

/**
 * The status request every Minecraft client sends for the multiplayer list.
 */
final class ServerListPing
{
    private const int MAX_RESPONSE_BYTES = 256 * 1024;

    /** @return array<string, mixed> */
    public static function ping(string $host, int $port, float $timeout = 3.0): array
    {
        $socket = @stream_socket_client("tcp://{$host}:{$port}", $code, $message, $timeout);

        if ($socket === false) {
            throw new RuntimeException("Could not connect to {$host}:{$port}: {$message}");
        }

        try {
            stream_set_timeout($socket, (int) ceil($timeout));

            $handshake = "\x00".self::varInt(-1).self::varInt(mb_strlen($host, '8bit')).$host.pack('n', $port).self::varInt(1);
            fwrite($socket, self::varInt(mb_strlen($handshake, '8bit')).$handshake);
            fwrite($socket, "\x01\x00");

            $length = self::readVarInt($socket);

            if ($length <= 0 || $length > self::MAX_RESPONSE_BYTES) {
                throw new RuntimeException('Invalid status response length.');
            }

            $packet = self::read($socket, $length);
            $offset = 0;

            if (self::varIntAt($packet, $offset) !== 0) {
                throw new RuntimeException('Unexpected status packet.');
            }

            $jsonLength = self::varIntAt($packet, $offset);
            $status = json_decode(mb_substr($packet, $offset, $jsonLength, '8bit'), true);

            if (! is_array($status)) {
                throw new RuntimeException('The status response is not valid JSON.');
            }

            return $status;
        } finally {
            fclose($socket);
        }
    }

    private static function varInt(int $value): string
    {
        $value &= 0xFFFFFFFF;
        $bytes = '';

        do {
            $byte = $value & 0x7F;
            $value >>= 7;
            $bytes .= chr($value !== 0 ? $byte | 0x80 : $byte);
        } while ($value !== 0);

        return $bytes;
    }

    private static function varIntAt(string $data, int &$offset): int
    {
        $value = 0;

        for ($shift = 0; $shift < 35; $shift += 7) {
            if (! isset($data[$offset])) {
                throw new RuntimeException('Truncated VarInt.');
            }

            $byte = ord($data[$offset++]);
            $value |= ($byte & 0x7F) << $shift;

            if (($byte & 0x80) === 0) {
                return $value;
            }
        }

        throw new RuntimeException('VarInt is too long.');
    }

    /** @param resource $socket */
    private static function readVarInt($socket): int
    {
        $value = 0;

        for ($shift = 0; $shift < 35; $shift += 7) {
            $byte = ord(self::read($socket, 1));
            $value |= ($byte & 0x7F) << $shift;

            if (($byte & 0x80) === 0) {
                return $value;
            }
        }

        throw new RuntimeException('VarInt is too long.');
    }

    /** @param resource $socket */
    private static function read($socket, int $length): string
    {
        $data = '';

        while (mb_strlen($data, '8bit') < $length) {
            $chunk = fread($socket, $length - mb_strlen($data, '8bit'));

            if ($chunk === false || $chunk === '') {
                throw new RuntimeException('The server closed the connection.');
            }

            $data .= $chunk;
        }

        return $data;
    }
}
