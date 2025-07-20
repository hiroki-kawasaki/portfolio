export const ENDPOINT_MAP = {
/**
    ENDPOINT_KEY: [PATH_KEY<string>, params<object object>]
**/
    root         : ['/'                    , {}],
    home         : ['/home'                , {}],
    about_xxxx   : ['/services/xxxx'       , {}],
    docs_xxxx    : ['/services/{name}/docs', {name: 'xxxx'}],
    xxxx_home    : ['/xxxx/home'           , {}],
    service_index: ['/services'            , {}],
};



/*** Generate Data ***/

export const PATH_SET = new Set(Object.values(ENDPOINT_MAP).map(v => v[0]));
export const PATH_LIST = [...PATH_SET];
