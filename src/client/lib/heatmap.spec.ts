import { expect, test } from 'vitest';
import { buildHeatmap } from './heatmap';

test('averages samples per local weekday and hour', () => {
    const monday = new Date(2026, 9, 5, 18, 0, 0);
    const nextMonday = new Date(2026, 9, 12, 18, 0, 0);

    const heatmap = buildHeatmap([
        { hour: monday.toISOString(), average: 4, peak: 6 },
        { hour: nextMonday.toISOString(), average: 2, peak: 9 },
    ]);

    expect(heatmap.cells[0][18]).toBe(3);
    expect(heatmap.max).toBe(3);
    expect(heatmap.peak?.players).toBe(9);
    expect(heatmap.cells[1][18]).toBe(0);
});

test('handles an empty history', () => {
    expect(buildHeatmap([])).toMatchObject({ max: 0, peak: null });
});
