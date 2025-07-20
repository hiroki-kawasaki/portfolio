import session from '@f-s/session';



export async function POST() {
    const sessionStore = await session();
    const res = await sessionStore.refresh();

    return Response.json({ok: res}, {status: res ? 200 : 407});
}
