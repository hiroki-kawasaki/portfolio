import session from '@f-s/session';



export default async function manifest () {
    const sessionStore = await session();

    return {
        name: 'Portfolio',
        short_name: 'Portfolio',
        description: 'Portfolio',
        start_url: '/',
        display: 'standalone',
        background_color: sessionStore.theme_color,
        theme_color: sessionStore.theme_color,
        icons: [
            {
                src: '/favicon.ico',
                sizes: '48px',
                type: 'image/x-icon',
            },
        ],
    };
}