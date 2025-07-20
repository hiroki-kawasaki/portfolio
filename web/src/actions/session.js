'use server';

import { redirect } from 'next/navigation';

import session from '@f-s/session';



export async function setSessionAction(name, value) {
    const sessionStore = await session();
    sessionStore[name] = value;
}



export async function logoutAction() {
    const sessionStore = await session();
    await sessionStore.logout();
    redirect('/');
}