import { Inter } from "next/font/google";
import { Do_Hyeon } from "next/font/google";
import "./globals.css";
import ClientLayout from '@/components/navbar/ClientLayout'; // ClientLayout 경로를 실제 위치로 수정하세요.
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

const inter = Inter({ subsets: ["latin"] });
const dohyun = Do_Hyeon({
    weight: ['400'],
    subsets: ['latin'],
    display: 'swap',
})

export const metadata = {
    title: "Rocki-Biki!",
    description: "ROCKIBIKINICITY!",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className={dohyun.className}>
        <ClientLayout>{children}</ClientLayout>
        </body>
        </html>
    );
}
