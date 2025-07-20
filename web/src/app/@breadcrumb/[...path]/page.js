import Breadcrumb from '../server';

export default async function Page({params, searchParams}) {
    const path = (await params).path;

    return <Breadcrumb path={'/' + path.join('/')} searchParams={await searchParams}/>;
}
