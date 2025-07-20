import { redirect } from 'next/navigation';

import session from '@f-s/session';



export async function GET(request) {
    const host = request.headers.get('host');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const sessionStore = await session();
    const res = await sessionStore.signin(code, `https://${host}/login/callback`);
    return res ? redirect('/home') : redirect('/');
}
