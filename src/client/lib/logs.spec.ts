import { expect, test } from 'vitest';
import { countLevels, filterLines, parseLog } from './logs';

const log = [
    '[12:00:00] [Server thread/INFO]: Starting minecraft server version 26.1.2',
    '[12:00:01] [Server thread/WARN]: Can\'t keep up!',
    '[12:00:02] [Server thread/ERROR]: Encountered an unexpected exception',
    'java.lang.NullPointerException: boom',
    '\tat net.minecraft.Server.tick(Server.java:12)',
    'Caused by: java.io.IOException: disk full',
    '\t... 3 more',
    '[12:00:03] [Server thread/INFO]: Done (3.2s)!',
].join('\n');

test('stack traces stay with their error', () => {
    const lines = parseLog(log);

    expect(lines.map((line) => line.level)).toEqual(['info', 'warn', 'error', 'error', 'error', 'error', 'error', 'info']);
    expect(lines[7].number).toBe(8);
});

test('counts entries and filters by level and search', () => {
    const lines = parseLog(log);

    expect(countLevels(lines)).toEqual({ info: 2, warn: 1, error: 2 });
    expect(filterLines(lines, 'errors', '').length).toBe(5);
    expect(filterLines(lines, 'problems', '').length).toBe(6);
    expect(filterLines(lines, 'all', 'done').map((line) => line.number)).toEqual([8]);
});
