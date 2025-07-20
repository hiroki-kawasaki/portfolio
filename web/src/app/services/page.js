import Link from 'next/link';

import { MaterialSymbol } from '@c/icon';

import useTranslate from '@f/i18n';
import session from '@f-s/session';

import { SERVICE_LIST } from '@d/service';

import styles from './style.module.css';



export default async function Page() {
    const sessionStore = await session();
    const lang = sessionStore.display_lang;
    const t = useTranslate(lang);

    return (
        <div className={styles.page}>
            {SERVICE_LIST.map((section, i) => (
                <Section key={i} title={t(section.name)}>
                    {section.cards.map((card, j) => (
                        <Card
                            key={j}
                            title={t(`oes__${card.name}`)}
                            explanation={t(`oese__${card.name}`)}
                            href={card.href}
                            iconName={card.icon}
                        />
                    ))}
                </Section>
            ))}
        </div>
    );
}


function Section ({title, children}) {
    return (
        <div className={styles.section}>
            <h3 className={styles.section_title}>{title}</h3>
            <div className={styles.card_grid}>
                {children}
            </div>
        </div>
    );
}


function Card ({href, iconName, title, explanation}) {
    return (
        <Link className={styles.card} href={href}>
            <MaterialSymbol name={iconName} className={styles.card_icon}/>
            <h4 className={styles.card_title}>{title}</h4>
            <p className={styles.card_description}>{explanation}</p>
        </Link>
    );
}
