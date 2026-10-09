export function formatBytes(bytes: number): string {
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

export function formatPlayTime(ticks: number): string {
    const hours = ticks / 20 / 3600;

    return hours >= 1 ? `${hours.toFixed(1)} h` : `${Math.round(hours * 60)} min`;
}

export function formatDistance(centimeters: number): string {
    const meters = centimeters / 100;

    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatDate(value: string | null): string {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value.replace(/ ([+-]\d{4})$/, '$1').replace(' ', 'T'));

    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function itemName(id: string): string {
    return id
        .replace(/^minecraft:/, '')
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
