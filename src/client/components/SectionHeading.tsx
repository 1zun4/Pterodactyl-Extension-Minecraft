import type { ReactNode } from 'react';

export default function SectionHeading({ children, first = false }: { children: ReactNode; first?: boolean }) {
    return <h3 className={`${first ? 'mc:mt-6' : 'mc:mt-8'} mc:mb-2 mc:text-2xl`}>{children}</h3>;
}
