import { LANG_MAP, WORD_MAP } from '@d/lang';



const useTranslate = (lang) => {
    if (!(lang in LANG_MAP)) lang = 'ja';

    const wordSet = WORD_MAP[lang];
    return (word) => wordSet[word] || WORD_MAP.ja[word] || word;
};
export default useTranslate;
