import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { serverResourcesQueryOptions } from '@pterodactyl/sdk';
import { createExtensionTestHost, createTestServer } from '@pterodactyl/sdk/testing';
import PropertiesScreen from './PropertiesScreen';

vi.mock('../api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api')>()),
    getProperties: vi.fn().mockResolvedValue({
        exists: true,
        properties: [
            { key: 'motd', value: 'A Minecraft Server' },
            { key: 'pvp', value: 'true' },
            { key: 'server-port', value: '25565' },
            { key: 'my-plugin.flag', value: 'false' },
        ],
    }),
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
    render(<PropertiesScreen />, { wrapper: host.Wrapper });
}

test('groups properties and tracks unsaved changes', async () => {
    renderScreen(['ext.minecraft.properties-read', 'ext.minecraft.properties-update']);

    expect(await screen.findByDisplayValue('A Minecraft Server')).toBeTruthy();
    expect(screen.getByText('Gameplay')).toBeTruthy();
    expect(screen.getByText('Advanced')).toBeTruthy();
    expect(screen.getByText('Managed')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('MOTD'), { target: { value: 'Welcome' } });
    expect(screen.getByRole('button', { name: 'Save (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByDisplayValue('A Minecraft Server')).toBeTruthy();
});

test('filters by search', async () => {
    renderScreen(['ext.minecraft.properties-read']);

    await screen.findByDisplayValue('A Minecraft Server');
    fireEvent.change(screen.getByLabelText('Search properties'), { target: { value: 'pvp' } });

    expect(screen.queryByDisplayValue('A Minecraft Server')).toBeNull();
    expect(screen.getByText('PvP')).toBeTruthy();
});

test('hides saving without the update permission', async () => {
    renderScreen(['ext.minecraft.properties-read']);

    await screen.findByDisplayValue('A Minecraft Server');
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
});
