import type { HistoryResponse } from '../api';

export interface Heatmap {
    /** Average players per weekday (Monday first) and local hour. */
    cells: number[][];
    max: number;
    peak: { players: number; at: Date } | null;
}

export function buildHeatmap(hours: HistoryResponse['hours']): Heatmap {
    const sums = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    let peak: Heatmap['peak'] = null;

    for (const sample of hours) {
        const at = new Date(sample.hour);
        const day = (at.getDay() + 6) % 7;
        const hour = at.getHours();

        sums[day][hour] += sample.average;
        counts[day][hour] += 1;

        if (peak === null || sample.peak > peak.players) {
            peak = { players: sample.peak, at };
        }
    }

    const cells = sums.map((row, day) => row.map((sum, hour) => (counts[day][hour] ? sum / counts[day][hour] : 0)));

    return { cells, max: Math.max(0, ...cells.flat()), peak };
}
