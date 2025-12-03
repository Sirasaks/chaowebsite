'use client';

import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Skip animation for admin pages (admin layout handles its own transition)
    const isAdminPage = pathname?.startsWith('/admin');

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <div
            className="animate-fade-in-up"
            key={pathname}
        >
            {children}
        </div>
    );
}
