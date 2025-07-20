import Link from 'next/link';

import { MaterialSymbol, MaterialSymbolLink } from '@c/icon';
import { GoogleLoginButton } from '@c-c/button';
import Dropdown, { DropdownSection, DropdownDivider, DropdownSetSessionButton, LogoutButton } from '@c-c/dropdown';
import useTranslate from '@f/i18n';
import cn from '@f/classnames';
import session from '@f-s/session';
import { LANG_MAP } from '@d/lang';

import styles from './header.module.css';

const VISUAL_MODES = ['light', 'dark'];




export default async function Header() {
    const sessionStore = await session();
    const lang = sessionStore.display_lang;
    const t = useTranslate(lang);

    return (
        <header className={styles.main}>
            <div className={cn(styles.l, 'pwa-none')}>
                <h2 className={styles.l}>
                    <Link href={sessionStore.is_signin ? '/home' : '/'}>Portfolio</Link>
                </h2>
                {sessionStore.is_signin && (
                    <div className={cn(styles.r, styles.iconWrap, 'sp-none')}>
                        <MaterialSymbolLink href="/services" name="apps"/>
                    </div>
                )}
            </div>
            <div className={cn(styles.r, 'sp-none')}>
                <div className={styles.l}>
                    <Dropdown buttonIconName="settings:fill" buttonClassName={styles.iconWrap}>
                        <DropdownSection title={t('lang')}>
                            {Object.keys(LANG_MAP).map((lang) => (
                                <DropdownSetSessionButton
                                    key={lang}
                                    name="display_lang"
                                    value={lang}
                                    isActive={sessionStore.display_lang === lang}
                                >{LANG_MAP[lang]}</DropdownSetSessionButton>
                            ))}
                        </DropdownSection>
                        <DropdownSection title={t('visual_mode')}>
                            {VISUAL_MODES.map((mode) => (
                                <DropdownSetSessionButton
                                    key={mode}
                                    name="visual_mode"
                                    value={mode}
                                    isActive={sessionStore.visual_mode === mode}
                                >
                                    <MaterialSymbol name={mode === 'dark' ? 'dark_mode' : 'light_mode'}/>
                                    {mode === 'dark' ? t('dark_mode') : t('light_mode')}
                                </DropdownSetSessionButton>
                            ))}
                        </DropdownSection>
                    </Dropdown>
                </div>
                <div className={styles.r}>
                    {sessionStore.is_signin ? (
                        <Dropdown buttonIconName={'account_circle'} buttonClassName={styles.iconWrap}>
                            <DropdownSection>
                                {/**ユーザ情報**/}
                            </DropdownSection>
                            <DropdownDivider/>
                            <DropdownSection>
                                <LogoutButton lang={lang}/>
                            </DropdownSection>
                        </Dropdown>
                    ) : (<>
                        <Dropdown className={styles.l} buttonClassName="gap-2" buttonContent={<>
                            <span>{t('login')}</span>
                        </>}>
                            <DropdownSection title={t('login')}>
                                <GoogleLoginButton text='Sign in'/>
                            </DropdownSection>
                        </Dropdown>
                        <Dropdown className={styles.r} buttonClassName={'btn gap-2'} buttonContent={<>
                            <span>{t('signup')}</span>
                        </>}>
                            <DropdownSection title={t('signup')}>
                                <GoogleLoginButton text='Sign up'/>
                            </DropdownSection>
                        </Dropdown>
                    </>)}
                </div>
            </div>
        </header>
    );
}