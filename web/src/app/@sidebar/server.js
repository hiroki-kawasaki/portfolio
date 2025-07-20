import Link from 'next/link';

import { MaterialSymbolLink } from '@c/icon';
import { SetSessionIconButton } from '@c-c/button';

import useTranslate from '@f/i18n';
import cn from '@f/classnames';
import { endpointToPath, pathToEndpoint, endpointCompare } from '@f-s/blueprint';
import session from '@f-s/session';

import { ENDPOINT_MAP } from '@d/path';
import { SIDEBAR_ITEM_MAP, SIDEBAR_MAP, SIDEBAR_LINK } from '@d/sidebar';

import styles from './style.module.css';



export default async function Sidebar({ path, searchParams }) {
    const sessionStore = await session();

    const lang = sessionStore.display_lang;
    const isSignin = sessionStore.is_signin;

    const t = useTranslate(lang);
    const currentEndpoint = pathToEndpoint(path, searchParams);

    let name = SIDEBAR_LINK[currentEndpoint[0]] || 'default';
    name = Array.isArray(name) ? name[isSignin ? 1 : 0] : name;
    const contents = SIDEBAR_MAP[name];
    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <h2>
                    <Link href={endpointToPath(ENDPOINT_MAP[contents.header[1]])}>{t(contents.header[0])}</Link>
                </h2>
                <SetSessionIconButton
                    name="is_sidebar_collapse"
                    value={!sessionStore.is_sidebar_collapse}
                    iconName={'close'}
                />
            </div>
            <nav>
                <ul>
                    {contents.items.map((name, k) => {
                        const item = SIDEBAR_ITEM_MAP[name];
                        const endpoint = ENDPOINT_MAP[item[2]];
                        return ( 
                            <li key={k} className={cn(endpointCompare(currentEndpoint, endpoint) && styles.active)}>
                                <MaterialSymbolLink
                                    href={endpointToPath(endpoint)}
                                    name={`${item[0]}:fill`}
                                >{t(item[1])}</MaterialSymbolLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
