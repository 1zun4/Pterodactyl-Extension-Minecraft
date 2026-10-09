interface Props<T extends string> {
    tabs: { id: T; label: string }[];
    active: T;
    onChange: (tab: T) => void;
}

export default function Tabs<T extends string>({ tabs, active, onChange }: Props<T>) {
    return (
        <div role='tablist' className='mc:flex mc:gap-2 mc:border-b mc:border-border mc:text-sm'>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type='button'
                    role='tab'
                    aria-selected={tab.id === active}
                    onClick={() => onChange(tab.id)}
                    className={
                        tab.id === active
                            ? 'mc:px-3 mc:py-2 mc:text-foreground mc:shadow-navigation-active'
                            : 'mc:px-3 mc:py-2 mc:text-muted-foreground mc:transition-colors mc:hover:text-foreground'
                    }
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
