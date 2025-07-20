import { Fragment } from 'react';
import Link from 'next/link';

import { MaterialSymbol } from '@c/icon';
import { SetSessionIconButton } from '@c-c/button';

import useTranslate from '@f/i18n';
import cn from '@f/classnames';
import { endpointToPath, pathToEndpoint, endpointCompare } from '@f-s/blueprint';
import session from '@f-s/session';

import { ENDPOINT_MAP } from '@d/path';
import { BREADCRUMB_ITEM_MAP, BREADCRUMB_LINK } from '@d/breadcrumb';

import styles from './style.module.css';



export default async function Breadcrumb({path, searchParams}) {
    const sessionStore = await session();

    const lang = sessionStore.display_lang;
    const isSignin = sessionStore.is_signin;

    const t = useTranslate(lang);
    const currentEndpoint = pathToEndpoint(path, searchParams);

    let name = BREADCRUMB_LINK[currentEndpoint[0]] || 'root';
    name = Array.isArray(name) ? name[isSignin ? 1 : 0] : name;
    const contents = name.split('>').map(k => BREADCRUMB_ITEM_MAP[k]).filter(v => v);
    return (<>
        <div></div>
        <div className={styles.main}>
            <div className={styles.collapse_btn}>
                <SetSessionIconButton
                    name="is_sidebar_collapse"
                    value={!sessionStore.is_sidebar_collapse}
                    iconName={sessionStore.is_sidebar_collapse ? 'left_panel_open' : 'left_panel_close'}
                />
            </div>
            <nav>
                {contents.map((c, i) => {
                    const endpoint = ENDPOINT_MAP[c[1]];
                    const isCurrent = endpointCompare(currentEndpoint, endpoint);
                    return (
                        <Fragment key={i}>
                            {i > 0 && <MaterialSymbol name="chevron_right" className={styles.separator}/>}
                            {isCurrent ? (
                                <span className={cn(styles.item, styles.current)}>{t(c[0])}</span>
                            ) : (
                                <Link href={endpointToPath(endpoint)} className={cn(styles.item, styles.link)}>
                                    {t(c[0])}
                                </Link>
                            )}
                        </Fragment>
                    );
                })}
            </nav>
        </div>
    </>);
}
