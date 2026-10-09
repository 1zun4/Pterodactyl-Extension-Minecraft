import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { serverResourcesQueryOptions } from '@pterodactyl/sdk';
import { createExtensionTestHost, createTestServer } from '@pterodactyl/sdk/testing';
import PlayersScreen from './PlayersScreen';

vi.mock('../api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api')>()),
    getPlayers: vi.fn().mockResolvedValue({
        status: { online: true, players: 1, max: 20, version: '1.21.11', motd: 'Hi', source: 'ping' },
        whitelist_enabled: true,
        online_mode: true,
        players: [
            { uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', name: 'Notch', online: true, operator: true, op_level: 4, whitelisted: true, banned: false, ban_reason: null, last_seen: null },
            { uuid: '853c80ef-3c37-49fd-aa49-938b674adae6', name: 'jeb_', online: false, operator: false, op_level: null, whitelisted: false, banned: true, ban_reason: 'Testing', last_seen: null },
        ],
        banned_ips: [{ ip: '203.0.113.7', reason: 'Spam', created: null }],
    }),
    getPlayer: vi.fn().mockResolvedValue({
        uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
        data: null,
        statistics: { play_time: 72000, deaths: 2, mob_kills: 0, player_kills: 0, distance_walked: 0, advancements: 3 },
        saved_at: null,
    }),
    getHistory: vi.fn().mockResolvedValue({ enabled: false, days: 28, hours: [] }),
}));

let host: ReturnType<typeof createExtensionTestHost> | undefined;

afterEach(() => {
    cleanup();
    host?.dispose();
    host = undefined;
});

function renderScreen(permissions: string[]) {
    const server = createTestServer({ uuid: 'f6b9e3a2-0000-4000-8000-000000000001', owner: false, permissions, eggFeatures: ['eula'] });
    host = createExtensionTestHost({ extensionId: 'minecraft', prefix: 'mc', server });
    host.queryClient.setQueryData(serverResourcesQueryOptions(server.attributes.uuid).queryKey, {
        object: 'stats',
        attributes: { current_state: 'running', is_suspended: false, resources: { memory_bytes: 0, cpu_absolute: 0, disk_bytes: 0, network_rx_bytes: 0, network_tx_bytes: 0, uptime: 0 } },
    });
    render(<PlayersScreen />, { wrapper: host.Wrapper });
}

test('lists players with filter counts', async () => {
    renderScreen(['ext.minecraft.players-read']);

    expect(await screen.findByText('Notch')).toBeTruthy();
    expect(screen.getByText('1 / 20')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Banned (1)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Banned IPs (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Banned (1)' }));
    expect(screen.queryByText('Notch')).toBeNull();
    expect(screen.getByText('jeb_')).toBeTruthy();
});

test('shows moderation actions only with the permission', async () => {
    renderScreen(['ext.minecraft.players-read', 'ext.minecraft.players-moderate']);

    fireEvent.click(await screen.findByText('Notch'));

    expect(await screen.findByText('Moderation')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'De-op' })).toBeTruthy();
    expect(screen.queryByText('Inventory & Effects')).toBeNull();
});
