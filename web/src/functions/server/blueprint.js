import { PATH_LIST } from '@d/path';



export function endpointToPath ([path, params]) {
    const pathname = path.replace(/\{(.*?)\}/g, (match, key) => params[key] || '');
    const searchParams = new URLSearchParams(Object.entries(params).filter(([key, value]) => !path.includes(key)));

    return `${pathname}${searchParams.toString().length > 0 ? '?' + searchParams.toString() : ''}`;
}



const COMPILED_PATH_LIST = PATH_LIST.map(template => {
    const paramKeys = (template.match(/\{([^\}]+)\}/g) || []).map(key => key.slice(1, -1));
    const regex = new RegExp(`^${template.replace(/\//g, '\\/').replace(/\{.*?\}/g, '([^/]+)')}$`);
    return [template, regex, paramKeys];
});
export function pathToEndpoint (path, searchParams) {
    for (const [template, regex, paramKeys] of COMPILED_PATH_LIST) {
        const matches = regex.exec(path);
        if (matches) {
            const pathParams = Object.fromEntries(paramKeys.map((key, index) => [key, matches[index + 1]]));
            return [
                template,
                { ...searchParams, ...pathParams }
            ];
        }
    }
    return [path, searchParams];
}



export function endpointCompare (ep1, ep2) {
    return ep1[0] === ep2[0] && Object.keys(ep2[1]).every(k => ep1[1][k] === ep2[1][k]);
}
