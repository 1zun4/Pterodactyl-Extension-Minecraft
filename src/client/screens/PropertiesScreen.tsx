import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Alert,
    Button,
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    Input,
    NamedIcon,
    Select,
    ServerContentBlock,
    ServerError,
    Spinner,
    Switch,
    TitledGreyBox,
    httpErrorToHuman,
    toast,
    useCurrentServerRequired,
    useNavigationBlocker,
    useSendServerPower,
    useServerPermission,
    useServerResources,
} from '@pterodactyl/sdk';
import { getProperties, keys, saveProperties } from '../api';
import { SECTIONS, describe, matches, type Property } from '../lib/properties';
import Pill from '../components/Pill';
import SectionHeading from '../components/SectionHeading';

export default function PropertiesScreen() {
    const server = useCurrentServerRequired();
    const { identifier, uuid } = server.attributes;
    const queryClient = useQueryClient();
    const canEdit = useServerPermission('ext.minecraft.properties-update');
    const canRestart = useServerPermission('control.restart');
    const state = useServerResources(uuid, (data) => data.attributes.current_state).data;
    const power = useSendServerPower(uuid);

    const query = useQuery({ queryKey: keys.properties(identifier), queryFn: () => getProperties(identifier) });
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [pendingRestart, setPendingRestart] = useState(false);
    const changes = Object.keys(draft).length;

    useNavigationBlocker(changes > 0);

    const save = useMutation({
        mutationFn: () => saveProperties(identifier, draft),
        onSuccess: (data) => {
            queryClient.setQueryData(keys.properties(identifier), data);
            setDraft({});
            setPendingRestart(true);
            toast.success('server.properties saved.');
        },
        onError: (error) => toast.error(httpErrorToHuman(error)),
    });

    const values = useMemo(
        () => Object.fromEntries((query.data?.properties ?? []).map(({ key, value }) => [key, value])),
        [query.data]
    );

    const invalid = Object.entries(draft).some(([key, value]) => {
        const property = describe(key, values[key] ?? value);

        return property.control === 'number' && !inRange(property, value);
    });

    const sections = useMemo(() => {
        const properties = (query.data?.properties ?? []).map(({ key, value }) => describe(key, value));

        return SECTIONS.map((section) => ({
            ...section,
            properties: properties.filter(
                (property) => property.section === section.id && matches(property, draft[property.key] ?? values[property.key] ?? '', search)
            ),
        })).filter((section) => section.properties.length > 0);
    }, [query.data, values, draft, search]);

    const change = (key: string, value: string) =>
        setDraft((current) => {
            const next = { ...current, [key]: value };

            if (value === values[key]) {
                delete next[key];
            }

            return next;
        });

    if (query.isError) {
        return <ServerError title='Could not load server.properties' message={httpErrorToHuman(query.error)} onRetry={() => query.refetch()} />;
    }

    return (
        <ServerContentBlock title='Properties'>
            <div className='mc:rounded-sm mc:bg-card mc:p-3 mc:shadow-md mc:md:flex mc:md:items-center mc:md:gap-4'>
                <div className='mc:flex-1'>
                    <h2 className='mc:font-header mc:text-sm mc:font-semibold mc:uppercase mc:tracking-wide mc:text-foreground'>server.properties</h2>
                    <p className='mc:mt-1 mc:text-xs mc:text-muted-foreground'>
                        Edit your Minecraft configuration without touching the file manager. Most changes apply after a restart.
                    </p>
                </div>
                <div className='mc:mt-3 mc:flex mc:items-center mc:gap-2 mc:md:mt-0'>
                    <Input
                        className='mc:md:w-64'
                        placeholder='Search properties...'
                        aria-label='Search properties'
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                    />
                    {canEdit && (
                        <>
                            <Button.Text disabled={changes === 0 || save.isPending} onClick={() => setDraft({})}>
                                Discard
                            </Button.Text>
                            <Button disabled={changes === 0 || invalid} isLoading={save.isPending} onClick={() => save.mutate()}>
                                {changes > 0 ? `Save (${changes})` : 'Save'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {pendingRestart && state === 'running' && (
                <Alert type='info' className='mc:mt-4'>
                    <div className='mc:flex mc:flex-1 mc:items-center mc:justify-between mc:gap-4'>
                        <span>Restart the server to apply your changes.</span>
                        {canRestart && (
                            <Button
                                size='small'
                                isLoading={power.isPending}
                                onClick={() =>
                                    power
                                        .mutateAsync({ signal: 'restart' })
                                        .then(() => setPendingRestart(false))
                                        .catch((error) => toast.error(httpErrorToHuman(error)))
                                }
                            >
                                Restart now
                            </Button>
                        )}
                    </div>
                </Alert>
            )}

            {query.isLoading ? (
                <Spinner centered size={Spinner.Size.LARGE} />
            ) : !query.data?.exists ? (
                <Empty className='mc:mt-6 mc:border'>
                    <EmptyHeader>
                        <EmptyMedia variant='icon'>
                            <NamedIcon name='file-question' />
                        </EmptyMedia>
                        <EmptyTitle>No server.properties yet</EmptyTitle>
                        <EmptyDescription>Start the server once so Minecraft creates the file.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : sections.length === 0 ? (
                <p className='mc:mt-6 mc:text-center mc:text-sm mc:text-muted-foreground'>No property matches "{search}".</p>
            ) : (
                sections.map((section, index) => (
                    <section key={section.id}>
                        <SectionHeading first={index === 0}>{section.title}</SectionHeading>
                        <div className='mc:grid mc:gap-4 mc:md:grid-cols-2 mc:lg:grid-cols-3'>
                            {section.properties.map((property) => (
                                <PropertyCard
                                    key={property.key}
                                    property={property}
                                    value={draft[property.key] ?? values[property.key] ?? ''}
                                    changed={property.key in draft}
                                    disabled={!canEdit || property.managed === true}
                                    onChange={(value) => change(property.key, value)}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </ServerContentBlock>
    );
}

interface CardProps {
    property: Property;
    value: string;
    changed: boolean;
    disabled: boolean;
    onChange: (value: string) => void;
}

function PropertyCard({ property, value, changed, disabled, onChange }: CardProps) {
    return (
        <TitledGreyBox
            title={
                <p className='mc:flex mc:items-center mc:gap-2 mc:text-sm mc:uppercase'>
                    <span className='mc:truncate'>{property.label}</span>
                    {property.managed && <Pill>Managed</Pill>}
                    {changed && <Pill tone='warning'>Changed</Pill>}
                </p>
            }
        >
            <PropertyControl property={property} value={value} disabled={disabled} onChange={onChange} />
            <p className='mc:mt-1 mc:text-xs mc:text-muted-foreground'>
                {property.managed ? 'Set by the panel from the server allocation.' : property.description}
                {property.description || property.managed ? ' ' : ''}
                <code className='mc:font-mono mc:opacity-70'>{property.key}</code>
            </p>
        </TitledGreyBox>
    );
}

function PropertyControl({ property, value, disabled, onChange }: Omit<CardProps, 'changed'>) {
    switch (property.control) {
        case 'switch':
            return <Switch aria-label={property.label} checked={value === 'true'} disabled={disabled} onChange={(checked) => onChange(checked ? 'true' : 'false')} />;
        case 'select': {
            const options = property.options ?? [];

            return (
                <Select
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

function inRange(property: Property, value: string): boolean {
    const number = Number(value);

    return value !== '' && value !== '-' && (property.min === undefined || number >= property.min) && (property.max === undefined || number <= property.max);
}
