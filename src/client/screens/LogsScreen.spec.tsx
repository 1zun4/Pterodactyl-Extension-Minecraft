import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createExtensionTestHost, createTestServer } from '@pterodactyl/sdk/testing';
import LogsScreen from './LogsScreen';

vi.mock('../api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api')>()),
    getLogs: vi.fn().mockResolvedValue({
        files: [
            { path: 'logs/latest.log', directory: 'logs', name: 'latest.log', size: 7900, modified: '2026-10-11T23:16:34+00:00' },
            { path: 'logs/2026-10-11-1.log.gz', directory: 'logs', name: '2026-10-11-1.log.gz', size: 726, modified: '2026-10-11T20:28:49+00:00' },
            { path: 'crash-reports/crash-2026-10-10.txt', directory: 'crash-reports', name: 'crash-2026-10-10.txt', size: 4000, modified: null },
        ],
        schedule: { enabled: false },
    }),
    getLogContent: vi.fn().mockResolvedValue({
        content: ['[12:00:00] [Server thread/INFO]: Starting minecraft server', '[12:00:01] [Server thread/WARN]: Can\'t keep up!', '\tat net.minecraft.Server.tick(Server.java:12)'].join('\n'),
        truncated: false,
    }),
}));

let host: ReturnType<typeof createExtensionTestHost> | undefined;

afterEach(() => {
    cleanup();
    host?.dispose();
    host = undefined;
    Reflect.deleteProperty(window, 'matchMedia');
});

function renderScreen() {
    const server = createTestServer({ uuid: 'f6b9e3a2-0000-4000-8000-000000000001', owner: false, permissions: ['ext.minecraft.logs-read'], eggFeatures: ['eula'] });
    host = createExtensionTestHost({ extensionId: 'minecraft', prefix: 'mc', server });
    render(<LogsScreen />, { wrapper: host.Wrapper });
}

test('lists the files on desktop and wraps lines on demand', async () => {
    renderScreen();

    expect(await screen.findByRole('button', { name: /2026-10-11-1\.log\.gz/ })).toBeTruthy();
    expect(await screen.findByText('[12:00:00] [Server thread/INFO]: Starting minecraft server')).toBeTruthy();
    expect(screen.getByText('Crash reports')).toBeTruthy();

    fireEvent.click(screen.getByRole('switch', { name: 'Wrap lines' }));

    const stack = await screen.findByText('at net.minecraft.Server.tick(Server.java:12)');
    expect(stack.textContent).toBe('    at net.minecraft.Server.tick(Server.java:12)');
    expect(stack.className).toContain('mc:whitespace-pre-wrap');
    expect(screen.getByText('[12:00:00] [Server thread/INFO]: Starting minecraft server')).toBeTruthy();
});

test('picks the file from a select on phones', async () => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }),
    });
    renderScreen();

    expect(await screen.findByLabelText('Log file')).toBeTruthy();
    expect(await screen.findByText('latest.log')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /2026-10-11-1\.log\.gz/ })).toBeNull();
    expect(await screen.findByText('[12:00:00] [Server thread/INFO]: Starting minecraft server')).toBeTruthy();
});
