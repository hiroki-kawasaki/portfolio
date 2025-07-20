export const BREADCRUMB_ITEM_MAP = {
/**
    BREADCRUMB_ITEM_KEY: [label<string>, ENDPOINT_KEY]
**/
    root      : ['home'           , 'root'],
    home      : ['home'           , 'home'],
    services  : ['service_index'  , 'service_index'],
    about_xxxx: ['portfolio__xxxx', 'about_xxxx'],
    xxxx_home : ['dashboard'      , 'xxxx_home'],
};


export const BREADCRUMB_LINK = {
/**
    PATH_KEY: BREADCRUMB_KEY || [GUEST::BREADCRUMB_KEY, MEMBER::BREADCRUMB_KEY]
**/
    '/': 'root',
    '/home': 'home',
    '/services': [
        'root>services',
        'home>services'
    ],
    '/services/xxxx': [
        'root>services>about_xxxx',
        'about_xxxx'
    ],
    '/services/{name}/docs': [
        'root',
        'home'
    ],
    '/xxxx/home': 'about_xxxx>xxxx_home',
};
