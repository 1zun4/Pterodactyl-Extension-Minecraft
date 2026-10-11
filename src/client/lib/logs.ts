export type Level = 'info' | 'warn' | 'error';

export interface LogLine {
    number: number;
    text: string;
    level: Level;
}

const ERROR = /\b(ERROR|FATAL|SEVERE)\b|Exception\b|^Caused by:/;
const WARN = /\bWARN(ING)?\b/;
// Stack traces and wrapped messages belong to the line above them.
const CONTINUATION = /^(\s+|\tat |at |Caused by:|\.\.\. \d+ more)/;

export function parseLog(content: string): LogLine[] {
    let previous: Level = 'info';

    return content.split(/\r?\n/).map((text, index) => {
        const level: Level = CONTINUATION.test(text) && text.trim() !== '' ? previous : ERROR.test(text) ? 'error' : WARN.test(text) ? 'warn' : 'info';
        previous = level;

        return { number: index + 1, text, level };
    });
}

export function countLevels(lines: LogLine[]): Record<Level, number> {
    const counts: Record<Level, number> = { info: 0, warn: 0, error: 0 };
    let previous: LogLine | null = null;

    // Count entries, not every line of a stack trace.
    for (const line of lines) {
        if (!(previous && previous.level === line.level && CONTINUATION.test(line.text))) {
            counts[line.level]++;
        }
        previous = line;
    }

    return counts;
}

export type Filter = 'all' | 'problems' | 'errors';

export function filterLines(lines: LogLine[], filter: Filter, search: string): LogLine[] {
    const query = search.trim().toLowerCase();

    return lines.filter(
        (line) =>
            (filter === 'all' || line.level === 'error' || (filter === 'problems' && line.level === 'warn')) &&
            (query === '' || line.text.toLowerCase().includes(query))
    );
}
