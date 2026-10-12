import { expect, test } from 'vitest';
import { expandTabs, lineIndex, rowAt, rowOffsets, wrappedRows } from './viewer';

test('expands tabs to the next tab stop', () => {
    expect(expandTabs('\tat net.minecraft')).toBe('    at net.minecraft');
    expect(expandTabs('ab\tc')).toBe('ab  c');
    expect(expandTabs('no tabs')).toBe('no tabs');
});

test('counts wrapped rows', () => {
    expect(wrappedRows('', 40)).toBe(1);
    expect(wrappedRows('x'.repeat(40), 40)).toBe(1);
    expect(wrappedRows('x'.repeat(41), 40)).toBe(2);
    expect(wrappedRows('x'.repeat(500), 0)).toBe(1);
    expect(wrappedRows('x'.repeat(500), Infinity)).toBe(1);
});

test('finds rows by offset', () => {
    const offsets = rowOffsets([20, 60, 20]);

    expect([...offsets]).toEqual([0, 20, 80, 100]);
    expect(rowAt(offsets, 0)).toBe(0);
    expect(rowAt(offsets, 19)).toBe(0);
    expect(rowAt(offsets, 20)).toBe(1);
    expect(rowAt(offsets, 79)).toBe(1);
    expect(rowAt(offsets, 95)).toBe(2);
    expect(rowAt(offsets, 500)).toBe(2);
    expect(rowAt(rowOffsets([]), 10)).toBe(0);
});

test('finds the first line at or after a number', () => {
    const lines = [{ number: 2 }, { number: 5 }, { number: 9 }];

    expect(lineIndex(lines, 1)).toBe(0);
    expect(lineIndex(lines, 5)).toBe(1);
    expect(lineIndex(lines, 6)).toBe(2);
    expect(lineIndex(lines, 10)).toBe(3);
});
