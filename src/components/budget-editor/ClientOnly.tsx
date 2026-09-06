'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Renderiza `children` SOLO tras montar en el cliente (post-hidratación).
 *
 * Necesario para `@react-pdf/renderer` (PDFDownloadLink): renderizarlo en
 * SSR/hidratación provoca errores de nivel document
 * ("<div> cannot be a child of <#document>" / "Only one element on document
 * allowed"). Con este wrapper, durante SSR/hidratación se pinta `fallback`
 * y el componente pesado entra client-only.
 */
export function ClientOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return <>{mounted ? children : fallback}</>;
}
