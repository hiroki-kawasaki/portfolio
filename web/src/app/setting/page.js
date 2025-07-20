import { MaterialSymbol } from '@c/icon';
import { SetSessionButton, LogoutButton, GoogleLoginButton } from '@c-c/button';
import useTranslate from '@f/i18n';
import cn from '@f/classnames';
import session from '@f-s/session';

import { LANG_MAP } from '@d/lang';

import styles from './style.module.css';

const VISUAL_MODES = [
    { value: 'light', icon: 'light_mode', labelKey: 'light_mode' },
    { value: 'dark', icon: 'dark_mode', labelKey: 'dark_mode' },
];

export default async function Page() {
    const sessionStore = await session();
    const lang = sessionStore.display_lang;
    const t = useTranslate(lang);

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>{t('setting')}</h2>
            <section className={styles.section}>
                <h3 className={styles.section_title}>{t('lang')}</h3>
                <div className={styles.items_grid}>
                    {Object.entries(LANG_MAP).map(([code, name]) => (
                        <SetSessionButton
                            key={code}
                            name="display_lang"
                            value={code}
                            className={cn(
                                styles.item,
                                sessionStore.display_lang === code && styles.active
                            )}
                        >
                            <MaterialSymbol name="language" className={styles.item_icon} />
                            <span className={styles.item_label}>{name}</span>
                        </SetSessionButton>
                    ))}
                </div>
            </section>
            <section className={styles.section}>
                <h3 className={styles.section_title}>{t('visual_mode')}</h3>
                <div className={styles.items_grid}>
                    {VISUAL_MODES.map((mode) => (
                        <SetSessionButton
                            key={mode.value}
                            name="visual_mode"
                            value={mode.value}
                            className={cn(
                                styles.item,
                                sessionStore.visual_mode === mode.value && styles.active
                            )}
                        >
                            <MaterialSymbol name={mode.icon} className={styles.item_icon} />
                            <span className={styles.item_label}>{t(mode.labelKey)}</span>
                        </SetSessionButton>
                    ))}
                </div>
            </section>
            <section className={styles.section}>
                <h3 className={styles.section_title}>{t('account')}</h3>
                <div className={styles.items_grid}>
                    {sessionStore.is_signin ? (
                        <LogoutButton className={cn(styles.item)}>
                            <MaterialSymbol name="logout" className={styles.item_icon} />
                            <span className={styles.item_label}>{t('logout')}</span>
                        </LogoutButton>
                    ) : <>
                        <GoogleLoginButton text='Sign in'/>
                    </>}
                </div>
            </section>
        </div>
    );
}