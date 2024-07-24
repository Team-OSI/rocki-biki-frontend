import { Inter } from "next/font/google";
import { Do_Hyeon } from "next/font/google";
import './globals.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import ClientSideWrapper from '@/app/ClientSideWrapper';

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });
const dohyun = Do_Hyeon({
    weight: ['400'],
    subsets: ['latin'],
    display: 'swap',
});

export const metadata = {
    title: "Rocki-Biki!",
    description: "ROCKIBIKINICITY!",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </head>
            <body className={dohyun.className}>
                <ClientSideWrapper>
                    {children}
                </ClientSideWrapper>
            </body>
        </html>
    );
}
