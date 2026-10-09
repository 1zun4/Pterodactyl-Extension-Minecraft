import type { ReactNode } from 'react';

const tones = {
    success: 'mc:bg-success/15 mc:text-success',
    warning: 'mc:bg-warning/15 mc:text-warning',
    info: 'mc:bg-primary/15 mc:text-primary',
    danger: 'mc:bg-destructive/15 mc:text-destructive',
    muted: 'mc:bg-muted mc:text-muted-foreground',
};

export default function Pill({ tone = 'muted', children }: { tone?: keyof typeof tones; children: ReactNode }) {
    return (
        <span className={`mc:inline-flex mc:items-center mc:rounded-full mc:px-2 mc:py-0.5 mc:text-xs mc:font-medium ${tones[tone]}`}>
            {children}
        </span>
    );
}
