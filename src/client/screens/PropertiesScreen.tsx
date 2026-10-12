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
    ServerContentBlock,
    ServerError,
    Spinner,
    TextArea,
    httpErrorToHuman,
    toast,
    useCurrentServerRequired,
    useNavigationBlocker,
    useSendServerPower,
    useServerPermission,
    useServerResources,
} from '@pterodactyl/sdk';
import { getProperties, keys, saveProperties, saveRawProperties } from '../api';
import { SECTIONS, describe, matches } from '../lib/properties';
import { WIDE, useMediaQuery } from '../lib/media';
import { CategoryChips, CompactSection, PropertyCard, SaveBar, inRange, type PropertySection } from '../properties/PropertyViews';
import SectionHeading from '../components/SectionHeading';

export default function PropertiesScreen() {
    const server = useCurrentServerRequired();
    const { identifier, uuid } = server.attributes;
    const queryClient = useQueryClient();
    const canEdit = useServerPermission('ext.minecraft.properties-update');
    const canRestart = useServerPermission('control.restart');
    const state = useServerResources(uuid, (data) => data.attributes.current_state).data;
    const power = useSendServerPower(uuid);
    const wide = useMediaQuery(WIDE);

    const query = useQuery({ queryKey: keys.properties(identifier), queryFn: () => getProperties(identifier) });
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [pendingRestart, setPendingRestart] = useState(false);
    const [raw, setRaw] = useState<string | null>(null);
    const changes = Object.keys(draft).length;
    const rawChanged = raw !== null && raw !== (query.data?.raw ?? '');

    useNavigationBlocker(changes > 0 || rawChanged);

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

    const saveRaw = useMutation({
        mutationFn: () => saveRawProperties(identifier, raw ?? ''),
        onSuccess: (data) => {
            queryClient.setQueryData(keys.properties(identifier), data);
            setRaw(data.raw);
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

    const sections = useMemo<PropertySection[]>(() => {
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

    // The editor and the raw file share one pair of actions.
    const editing = raw === null;
    const dirty = editing ? changes > 0 : rawChanged;
    const saving = editing ? save.isPending : saveRaw.isPending;
    const discard = () => (editing ? setDraft({}) : setRaw(query.data?.raw ?? ''));
    const submit = () => (editing ? save.mutate() : saveRaw.mutate());
    const saveLabel = editing && changes > 0 ? `Save (${changes})` : 'Save';

    if (query.isError) {
        return <ServerError title='Could not load server.properties' message={httpErrorToHuman(query.error)} onRetry={() => query.refetch()} />;
    }

    const field = (property: PropertySection['properties'][number]) => ({
        property,
        value: draft[property.key] ?? values[property.key] ?? '',
        changed: property.key in draft,
        disabled: !canEdit || property.managed === true,
        onChange: (value: string) => change(property.key, value),
    });

    return (
        <ServerContentBlock title='Properties'>
            <div className='mc:rounded-sm mc:bg-card mc:p-3 mc:shadow-md mc:lg:flex mc:lg:items-center mc:lg:gap-4'>
                <div className='mc:flex-1'>
                    <h2 className='mc:font-header mc:text-sm mc:font-semibold mc:uppercase mc:tracking-wide mc:text-foreground'>server.properties</h2>
                    <p className='mc:mt-1 mc:text-xs mc:text-muted-foreground'>
                        Edit your Minecraft configuration without touching the file manager. Most changes apply after a restart.
                    </p>
                </div>
                <div className='mc:mt-3 mc:flex mc:flex-col mc:gap-2 mc:sm:flex-row mc:sm:items-center mc:lg:mt-0'>
                    {editing ? (
                        <Input
                            className='mc:min-w-0 mc:sm:flex-1 mc:lg:w-64 mc:lg:flex-none'
                            placeholder='Search properties...'
                            aria-label='Search properties'
                            value={search}
                            onChange={(event) => setSearch(event.currentTarget.value)}
                        />
                    ) : null}
                    {canEdit && query.data?.exists && (
                        <div className='mc:flex mc:flex-wrap mc:items-center mc:gap-2 mc:*:whitespace-nowrap mc:sm:flex-nowrap'>
                            <Button.Text className='mc:mr-auto mc:sm:mr-0' disabled={changes > 0 || rawChanged} onClick={() => setRaw(editing ? (query.data?.raw ?? '') : null)}>
                                {editing ? 'Edit as file' : 'Back to the editor'}
                            </Button.Text>
                            <Button.Text disabled={!dirty || saving} onClick={discard}>
                                Discard
                            </Button.Text>
                            <Button disabled={!dirty || (editing && invalid)} isLoading={saving} onClick={submit}>
                                {saveLabel}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {pendingRestart && state === 'running' && (
                <Alert type='info' className='mc:mt-4'>
                    <div className='mc:flex mc:flex-1 mc:flex-wrap mc:items-center mc:justify-between mc:gap-x-4 mc:gap-y-2'>
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
            ) : !editing ? (
                <TextArea
                    aria-label='server.properties'
                    className='mc:mt-4 mc:min-h-[32rem] mc:font-mono mc:text-sm'
                    spellCheck={false}
                    value={raw}
                    onChange={(event) => setRaw(event.currentTarget.value)}
                />
            ) : sections.length === 0 ? (
                <p className='mc:mt-6 mc:text-center mc:text-sm mc:text-muted-foreground'>No property matches "{search}".</p>
            ) : wide ? (
                sections.map((section, index) => (
                    <section key={section.id}>
                        <SectionHeading first={index === 0}>{section.title}</SectionHeading>
                        <div className='mc:grid mc:gap-4 mc:md:grid-cols-2 mc:lg:grid-cols-3'>
                            {section.properties.map((property) => (
                                <PropertyCard key={property.key} {...field(property)} />
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                <>
                    <CategoryChips sections={sections} />
                    {sections.map((section, index) => (
                        <CompactSection key={section.id} section={section} first={index === 0} field={field} />
                    ))}
                </>
            )}

            {!wide && canEdit && dirty && (
                <SaveBar
                    message={editing ? `${changes} unsaved ${changes === 1 ? 'change' : 'changes'}` : 'Unsaved changes'}
                    saveLabel={saveLabel}
                    saving={saving}
                    invalid={editing && invalid}
                    onDiscard={discard}
                    onSave={submit}
                />
            )}
        </ServerContentBlock>
    );
}
