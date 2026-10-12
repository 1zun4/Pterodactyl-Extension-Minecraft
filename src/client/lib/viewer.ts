/** Replaces tabs with spaces up to the next tab stop, so wrapped monospace lines can be counted in characters. */
export function expandTabs(text: string, size = 4): string {
    if (!text.includes('\t')) {
        return text;
    }

    let column = 0;
    let result = '';

    for (const char of text) {
        if (char === '\t') {
            const spaces = size - (column % size);
            result += ' '.repeat(spaces);
            column += spaces;
        } else {
            result += char;
            column++;
        }
    }

    return result;
}

/** Visual rows a monospace line takes when it breaks after `columns` characters. */
export function wrappedRows(text: string, columns: number): number {
    return columns > 0 && Number.isFinite(columns) ? Math.max(1, Math.ceil(text.length / columns)) : 1;
}

/** Top offset of every row, followed by the total height. */
export function rowOffsets(heights: readonly number[]): Float64Array {
    const offsets = new Float64Array(heights.length + 1);

    for (let index = 0; index < heights.length; index++) {
        offsets[index + 1] = offsets[index] + heights[index];
    }

    return offsets;
}

/** Index of the row that covers `y`, clamped to the rows that exist. */
export function rowAt(offsets: Float64Array, y: number): number {
    const count = offsets.length - 1;
    let low = 0;
    let high = count - 1;

    while (low < high) {
        const middle = (low + high + 1) >> 1;

        if (offsets[middle] <= y) {
            low = middle;
        } else {
            high = middle - 1;
        }
    }

    return Math.max(0, low);
}

/** Index of the first line numbered `number` or later; lines are sorted by number. */
export function lineIndex(lines: readonly { number: number }[], number: number): number {
    let low = 0;
    let high = lines.length;

    while (low < high) {
        const middle = (low + high) >> 1;

        if (lines[middle].number < number) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return low;
}
