import { Geist, Geist_Mono } from 'next/font/google';

import Header from '@s-c/header';
import BottomNavigation from '@s-c/bottom-navigation'
import Auth from '@c-c/auth';
import cn from '@f/classnames';
import session from '@f-s/session';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});



export const metadata = {
    title: {
        default: 'Portfolio'
    },
    description: 'Portfolio',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico',
        other: {
            rel: 'apple-touch-icon-precomposed',
            url: '/favicon.ico',
        },
    },
    appleWebApp: {
        title: 'Portfolio',
        capable: true,
        statusBarStyle: 'black-translucent',
    },
};

export async function generateViewport() {
    const sessionStore = await session();

    return {
        width: 'device-width',
        initialScale: 1,
        viewportFit: 'cover',
        userScalable: 'no',
        themeColor: sessionStore.theme_color,
    };
}


export default async function RootLayout({ breadcrumb, sidebar, children }) {
    const sessionStore = await session();

    const materialSymbolsUrl = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
    return (
        <html lang={sessionStore.display_lang}>
            <head>
                <link href={materialSymbolsUrl} rel="stylesheet"/>
            </head>
            <body
                className={cn(
                    geistSans.variable,
                    geistMono.variable,
                    sessionStore.is_sidebar_collapse && 'sb-none',
                    sessionStore.visual_mode
                )}
            >
                <Header/>
                <main>
                    {breadcrumb}
                    {!sessionStore.is_sidebar_collapse && sidebar}
                    <div className="content-wrap">
                        {children}
                    </div>
                </main>
                <BottomNavigation/>
            </body>
            { sessionStore.is_signin && <Auth/> }
        </html>
    );
}
