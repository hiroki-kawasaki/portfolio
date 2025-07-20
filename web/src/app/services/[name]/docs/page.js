import useTranslate from '@f/i18n';
import session from '@f-s/session';



export default async function Page({params}) {
    const { name } = await params;

    const sessionStore = await session();
    const lang = sessionStore.display_lang;

    const t = useTranslate(lang);

    return (
        <div>{t('oes__'+name)} - {t('docs')}</div>
    );
}
