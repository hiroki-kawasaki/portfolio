import Sidebar from '../server';

export default async function Page({params, searchParams}) {
    const path = (await params).path;

    return <Sidebar path={'/' + path.join('/')} searchParams={await searchParams}/>;
}