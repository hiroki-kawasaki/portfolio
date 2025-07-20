export const SIDEBAR_ITEM_MAP = {
/**
    SIDEBAR_ITEM_KEY: [icon_name<string>, label<string>, ENDPOINT_KEY]
**/
    service_index           : ['apps'     , 'service_index'  , 'service_index'],
    about_xxxx              : ['dashboard', 'portfolio__xxxx', 'about_xxxx'],
    xxxx_home               : ['dashboard', 'dashboard'      , 'xxxx_home'],

};

export const SIDEBAR_MAP = {
/**
    SIDEBAR_KEY: {
        header: [label<string>, ENDPOINT_KEY],
        items: [...SIDEBAR_ITEM_KEY]
    }
**/
    default: {
        header: ['home', 'root'],
        items: [
            'about_xxxx',
            'service_index'
        ],
    },
    xxxx: {
        header: ['portfolio__xxxx', 'about_xxxx'],
        items:  ['xxxx_home']
    },
};

export const SIDEBAR_LINK = {
/**
    PATH_KEY: SIDEBAR_KEY || [GUEST::SIDEBAR_KEY, MEMBER::SIDEBAR_KEY]
**/
    '/'                           : 'default',
    '/home'                       : 'default',
    '/services'                   : 'default',
    '/services/xxxx'              : ['default', 'xxxx'],
    '/xxxx/home'                  : ['default', 'xxxx'],
};
