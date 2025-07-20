import useTranslate from '@f/i18n';
import session from '@f-s/session';
import api from '@f-s/api';



export default async function Page() {
    const sessionStore = await session();
    const lang = sessionStore.display_lang;

    const t = useTranslate(lang);

    return (
        <div>{t('home')}</div>
    );
}

