import { redirect } from 'next/navigation';

import session from '@f-s/session';

export const metadata = {
    title: 'Portfolio Managed Console',
    description: 'Portfolio Managed Console',
};



export default async function Layout({ children }) {
    const sessionStore = await session();
    if (!sessionStore.is_signin) redirect('/');

    return children;
}
