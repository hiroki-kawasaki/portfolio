import Sidebar from './server';

export default async function Page({searchParams}) {
    return <Sidebar path={'/'} searchParams={await searchParams}/>;
}