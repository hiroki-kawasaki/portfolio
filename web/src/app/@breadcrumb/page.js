import Breadcrumb from './server';

export default async function Page({searchParams}) {    
    return <Breadcrumb path={'/'} searchParams={await searchParams}/>;
}