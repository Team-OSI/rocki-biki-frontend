'use client';

import { MusicProvider } from '@/app/contexts/MusicContext';
import ClientLayout from '@/components/navbar/ClientLayout';

export default function ClientSideWrapper({ children }) {
    return (
        <MusicProvider>
            <ClientLayout>{children}</ClientLayout>
        </MusicProvider>
    );
}
