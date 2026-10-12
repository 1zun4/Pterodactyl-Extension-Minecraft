import { Button, Input, Select, Switch, TitledGreyBox } from '@pterodactyl/sdk';
import type { Property, SectionId } from '../lib/properties';
import Pill from '../components/Pill';
import SectionHeading from '../components/SectionHeading';

export interface PropertySection {
    id: SectionId;
    title: string;
    properties: Property[];
}

export interface FieldProps {
    property: Property;
    value: string;
    changed: boolean;
    disabled: boolean;
    onChange: (value: string) => void;
}

/** Selects with short options and numbers fit next to the label on phones. */
const INLINE_SELECT_LENGTH = 12;

const sectionAnchor = (id: SectionId) => `mc-properties-${id}`;

export function inRange(property: Property, value: string): boolean {
    const number = Number(value);

    return value !== '' && value !== '-' && (property.min === undefined || number >= property.min) && (property.max === undefined || number <= property.max);
}

function isInline(property: Property): boolean {
    return (
        property.control === 'switch' ||
        property.control === 'number' ||
        (property.control === 'select' && (property.options ?? []).every((option) => option.length <= INLINE_SELECT_LENGTH))
    );
}

function Badges({ property, changed }: { property: Property; changed: boolean }) {
    return (
        <>
            {property.managed && <Pill>Managed</Pill>}
            {changed && <Pill tone='warning'>Changed</Pill>}
        </>
    );
}

function Help({ property, className }: { property: Property; className: string }) {
    return (
        <p className={className}>
            {property.managed ? 'Set by the panel from the server allocation.' : property.description}
            {property.description || property.managed ? ' ' : ''}
            <code className='mc:font-mono mc:opacity-70'>{property.key}</code>
        </p>
    );
}

export function PropertyCard({ property, value, changed, disabled, onChange }: FieldProps) {
    return (
        <TitledGreyBox
            title={
                <p className='mc:flex mc:items-center mc:gap-2 mc:text-sm mc:uppercase'>
                    <span className='mc:truncate'>{property.label}</span>
                    <Badges property={property} changed={changed} />
                </p>
            }
        >
            <PropertyControl property={property} value={value} disabled={disabled} onChange={onChange} />
            <Help property={property} className='mc:mt-1 mc:text-xs mc:text-muted-foreground' />
        </TitledGreyBox>
    );
}

/** One line per property on phones and tablets: label and short controls side by side, longer inputs below. */
function PropertyRow({ property, value, changed, disabled, onChange }: FieldProps) {
    const id = `mc-property-${property.key}`;
    const inline = isInline(property);
    const control = <PropertyControl id={id} property={property} value={value} disabled={disabled} onChange={onChange} />;

    return (
        <div className='mc:border-t mc:border-border mc:py-3'>
            <div className='mc:flex mc:items-center mc:justify-between mc:gap-3'>
                <label htmlFor={property.control === 'switch' ? undefined : id} className='mc:flex mc:min-w-0 mc:flex-wrap mc:items-center mc:gap-x-2 mc:gap-y-1 mc:text-sm mc:text-foreground'>
                    {property.label}
                    <Badges property={property} changed={changed} />
                </label>
                {inline && <div className={property.control === 'switch' ? 'mc:shrink-0' : 'mc:w-32 mc:shrink-0'}>{control}</div>}
            </div>
            {!inline && <div className='mc:mt-2'>{control}</div>}
            <Help property={property} className='mc:mt-1 mc:text-[0.7rem] mc:leading-snug mc:text-muted-foreground' />
        </div>
    );
}

interface CompactSectionProps {
    section: PropertySection;
    first: boolean;
    field: (property: Property) => FieldProps;
}

export function CompactSection({ section, first, field }: CompactSectionProps) {
    return (
        <section id={sectionAnchor(section.id)} className='mc:scroll-mt-16'>
            <SectionHeading first={first}>{section.title}</SectionHeading>
            <div className='mc:overflow-hidden mc:rounded-sm mc:bg-card mc:px-3 mc:shadow-md'>
                <div className='mc:-mt-px mc:grid mc:grid-cols-1 mc:md:grid-cols-2 mc:md:gap-x-6'>
                    {section.properties.map((property) => (
                        <PropertyRow key={property.key} {...field(property)} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Jumps between categories; stays at the top while scrolling through the long list. */
export function CategoryChips({ sections }: { sections: PropertySection[] }) {
    return (
        <nav aria-label='Categories' className='mc:sticky mc:top-0 mc:z-10 mc:-mx-4 mc:mt-4 mc:bg-background/95 mc:py-2 mc:backdrop-blur-sm'>
            <div className='mc:flex mc:gap-2 mc:overflow-x-auto mc:px-4 mc:[scrollbar-width:none] mc:[&::-webkit-scrollbar]:hidden'>
                {sections.map((section) => (
                    <button
                        key={section.id}
                        type='button'
                        onClick={() => document.getElementById(sectionAnchor(section.id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className='mc:shrink-0 mc:whitespace-nowrap mc:rounded-full mc:border mc:border-border mc:bg-card mc:px-3 mc:py-1.5 mc:text-xs mc:text-muted-foreground mc:transition-colors mc:hover:text-foreground'
                    >
                        {section.title} <span className='mc:tabular-nums mc:opacity-60'>{section.properties.length}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

interface SaveBarProps {
    message: string;
    saveLabel: string;
    saving: boolean;
    invalid: boolean;
    onDiscard: () => void;
    onSave: () => void;
}

/** Keeps Save and Discard in reach on phones while the header is scrolled away. */
export function SaveBar({ message, saveLabel, saving, invalid, onDiscard, onSave }: SaveBarProps) {
    return (
        <div
            role='region'
            aria-label='Unsaved changes'
            className='mc:sticky mc:bottom-0 mc:z-10 mc:-mx-4 mc:mt-4 mc:flex mc:items-center mc:justify-between mc:gap-3 mc:border-t mc:border-border mc:bg-card mc:px-4 mc:pt-3 mc:pb-[max(0.75rem,env(safe-area-inset-bottom))] mc:shadow-lg'
        >
            <span className='mc:min-w-0 mc:text-sm mc:text-foreground'>{message}</span>
            <div className='mc:flex mc:shrink-0 mc:gap-2'>
                <Button.Text disabled={saving} onClick={onDiscard}>
                    Discard
                </Button.Text>
                <Button disabled={invalid} isLoading={saving} onClick={onSave}>
                    {saveLabel}
                </Button>
            </div>
        </div>
    );
}

function PropertyControl({ id, property, value, disabled, onChange }: Omit<FieldProps, 'changed'> & { id?: string }) {
    switch (property.control) {
        case 'switch':
            return <Switch aria-label={property.label} checked={value === 'true'} disabled={disabled} onChange={(checked) => onChange(checked ? 'true' : 'false')} />;
        case 'select': {
            const options = property.options ?? [];

            return (
                <Select
                    id={id}
                    value={value}
                    disabled={disabled}
                    onChange={(selected) => onChange(String(selected))}
                    options={[...(options.includes(value) ? [] : [value]), ...options].map((option) => ({ value: option, label: option || 'Default' }))}
                />
            );
        }
        case 'number':
            return (
                <Input
                    id={id}
                    aria-label={property.label}
                    inputMode='numeric'
                    autoComplete='off'
                    value={value}
                    readOnly={disabled}
                    $hasError={!inRange(property, value)}
                    onChange={(event) => /^-?\d*$/.test(event.currentTarget.value) && onChange(event.currentTarget.value)}
                />
            );
        default:
            return (
                <Input
                    id={id}
                    aria-label={property.label}
                    type={property.control === 'password' ? 'password' : 'text'}
                    autoComplete='off'
                    value={value}
                    readOnly={disabled}
                    onChange={(event) => onChange(event.currentTarget.value)}
                />
            );
    }
}
