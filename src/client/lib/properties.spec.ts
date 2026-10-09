import { describe as group, expect, test } from 'vitest';
import { describe, matches, titleCase } from './properties';

group('describe', () => {
    test('uses the schema for known keys', () => {
        expect(describe('difficulty', 'easy')).toMatchObject({ label: 'Difficulty', section: 'gameplay', control: 'select' });
        expect(describe('server-port', '25565')).toMatchObject({ managed: true, control: 'number' });
        expect(describe('rcon.password', '')).toMatchObject({ control: 'password' });
    });

    test('guesses controls for unknown keys from their value', () => {
        expect(describe('some-mod-flag', 'true')).toMatchObject({ label: 'Some Mod Flag', section: 'advanced', control: 'switch' });
        expect(describe('custom.limit', '-5')).toMatchObject({ control: 'number' });
        expect(describe('custom.text', 'hello')).toMatchObject({ control: 'text' });
    });
});

test('matches searches by key, label, description and value', () => {
    const property = describe('max-players', '20');

    expect(matches(property, '20', 'max play')).toBe(true);
    expect(matches(property, '20', 'MAX-PLAYERS')).toBe(true);
    expect(matches(property, '20', '20')).toBe(true);
    expect(matches(property, '20', 'motd')).toBe(false);
});

test('titleCase splits on dashes and dots', () => {
    expect(titleCase('query.port')).toBe('Query Port');
});
