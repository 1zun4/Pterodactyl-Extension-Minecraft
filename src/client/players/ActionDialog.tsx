import { useEffect, useState, type ReactNode } from 'react';
import { Button, Dialog, Input, Label, Select } from '@pterodactyl/sdk';

export interface ActionField {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'select';
    options?: { value: string; label: string }[];
    placeholder?: string;
    defaultValue?: string;
    optional?: boolean;
}

export interface ActionDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: ReactNode;
    confirm: string;
    danger?: boolean;
    fields?: ActionField[];
    /** The user has to type this exact text before confirming. */
    typeToConfirm?: string;
    pending: boolean;
    onSubmit: (values: Record<string, string>) => void;
}

export default function ActionDialog({ open, onClose, title, description, confirm, danger, fields = [], typeToConfirm, pending, onSubmit }: ActionDialogProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [typed, setTyped] = useState('');

    useEffect(() => {
        if (open) {
            setValues(Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ''])));
            setTyped('');
        }
    }, [open]);

    const missing = fields.some((field) => !field.optional && (values[field.name] ?? '').trim() === '');
    const blocked = missing || (typeToConfirm !== undefined && typed !== typeToConfirm);
    const ConfirmButton = danger ? Button.Danger : Button;

    return (
        <Dialog open={open} onClose={onClose} title={title} description={description} preventExternalClose={pending}>
            <form
                className='mc:m-0 mc:grid mc:gap-4'
                onSubmit={(event) => {
                    event.preventDefault();

                    if (!blocked) {
                        onSubmit(values);
                    }
                }}
            >
                {fields.map((field, index) => (
                    <div key={field.name}>
                        <Label htmlFor={`mc-${field.name}`}>{field.label}</Label>
                        {field.type === 'select' ? (
                            <Select
                                id={`mc-${field.name}`}
                                value={values[field.name] ?? ''}
                                options={field.options ?? []}
                                onChange={(value) => setValues((current) => ({ ...current, [field.name]: String(value) }))}
                            />
                        ) : (
                            <Input
                                id={`mc-${field.name}`}
                                autoFocus={index === 0}
                                autoComplete='off'
                                inputMode={field.type === 'number' ? 'numeric' : undefined}
                                placeholder={field.placeholder}
                                value={values[field.name] ?? ''}
                                onChange={(event) => {
                                    const value = event.currentTarget.value;

                                    if (field.type !== 'number' || /^\d*$/.test(value)) {
                                        setValues((current) => ({ ...current, [field.name]: value }));
                                    }
                                }}
                            />
                        )}
                    </div>
                ))}
                {typeToConfirm !== undefined && (
                    <div>
                        <Label htmlFor='mc-confirm'>
                            Type <code className='mc:font-mono'>{typeToConfirm}</code> to confirm
                        </Label>
                        <Input id='mc-confirm' autoComplete='off' autoFocus={fields.length === 0} value={typed} onChange={(event) => setTyped(event.currentTarget.value)} />
                    </div>
                )}
                <button type='submit' hidden aria-hidden />
            </form>
            <Dialog.Footer>
                <Button.Text className='mc:w-full mc:sm:w-auto' disabled={pending} onClick={onClose}>
                    Cancel
                </Button.Text>
                <ConfirmButton className='mc:w-full mc:sm:w-auto' disabled={blocked} isLoading={pending} onClick={() => onSubmit(values)}>
                    {confirm}
                </ConfirmButton>
            </Dialog.Footer>
        </Dialog>
    );
}
