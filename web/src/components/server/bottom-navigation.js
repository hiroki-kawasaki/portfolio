import Link from 'next/link';

import { MaterialSymbol } from '@c/icon';
import cn from '@f/classnames';
import useTranslate from '@f/i18n';
import session from '@f-s/session';

import styles from './bottom-navigation.module.css';



export default async function BottomNavigation () {
    const sessionStore = await session();
    const lang = sessionStore.display_lang;
    const t = useTranslate(lang);

    return (
        <div className={cn(styles.main, 'sp-only')}>
            <Link href="/services" className={cn(styles.item)}>
                <MaterialSymbol name="widgets:fill" className={styles.icon}/>
                <span className={styles.text}>{t('services')}</span>
            </Link>
            <Link href="/services/xxxx" className={cn(styles.item)}>
                <MaterialSymbol name="dashboard" className={styles.icon}/>
                <span className={styles.text}>{t('oes__xxxx')}</span>
            </Link>
            <Link href="/services/module-repository" className={cn(styles.item)}>
                <MaterialSymbol name="folder_open:fill" className={styles.icon}/>
                <span className={styles.text}>{t('repository')}</span>
            </Link>
            <Link href="/setting" className={cn(styles.item)}>
                <MaterialSymbol name="settings:fill" className={styles.icon}/>
                <span className={styles.text}>{t('setting')}</span>
            </Link>
        </div>
    );
}