import { cookies } from 'next/headers';

import { encrypt, decrypt } from '@f-s/crypto';
import { cognito } from '@f-s/api';
import { LANG_MAP } from '@d/lang';



class Session {
    #cookiesStore
    #cognito

    constructor (cookiesStore) {
        this.#cookiesStore = cookiesStore;
        this.#cognito = cognito();
    }

    #getValue (name, {isEncrypt=true, defaultValue=null}={}) {
        const value = this.#cookiesStore.get(`__Host-${name}`)?.value;
        return (value && isEncrypt) ? decrypt(value) : value || defaultValue;
    }
    #setValue (name, value, options={}, {isEncrypt=true}={}) {
        try {
            if (isEncrypt) value = encrypt(value);
            this.#cookiesStore.set(`__Host-${name}`, value, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/',
                ...options
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    async signin (code, redirect_uri) {
        const res = await this.#cognito.authorization(code, redirect_uri);
        if(!res.ok) return false;

        const json = await res.json();
        this.#setValue('IdToken', json.id_token, {maxAge: 300});
        this.#setValue('AccessToken', json.access_token, {maxAge: 300});
        this.#setValue('RefreshToken', json.refresh_token, {maxAge: 31536000});
        this.#setValue('IsSignin', 'true', {sameSite: 'Lax', maxAge: 31536000});
        return true;
    }
    async refresh () {
        const refresh_token = this.refresh_token;
        if (!refresh_token) return false;
    
        const res = await this.#cognito.refresh(refresh_token);
        if(!res.ok) return false;

        const json = await res.json();
        this.#setValue('IdToken', json.id_token, {maxAge: 300});
        this.#setValue('AccessToken', json.access_token, {maxAge: 300});
        this.#setValue('RefreshToken', json.refresh_token, {maxAge: 31536000});
        return true;
    }
    async logout () {
        this.#cognito.revoke(this.refresh_token);
        this.#setValue('IdToken', '', {maxAge: 0});
        this.#setValue('RefreshToken', '', {maxAge: 0});
        this.#setValue('IsSignin', '', {maxAge: 0});
    }

    get id_token () {
        return this.#getValue('IdToken');
    }
    get access_token () {
        return this.#getValue('AccessToken');
    }
    get refresh_token () {
        return this.#getValue('RefreshToken');
    }
    get is_signin () {
        return this.#getValue('IsSignin') === 'true';
    }

    get #userData () {
        try {
            const value = this.#getValue('UserData');
            return value ? JSON.parse(value) : {};
        } catch (e) {
            return {};
        }
    }
    #setUserData (name, value) {
        const userData = this.#userData;
        userData[name] = value;
        this.#setValue('UserData', JSON.stringify(userData), {
            sameSite: 'Lax',
            maxAge: 31536000,
        });
    }

    get display_lang () {
        return this.#userData.displayLang || 'ja';
    }
    set display_lang (value) {
        if (!(value in LANG_MAP)) return;

        this.#setUserData('displayLang', value);
    }

    get visual_mode () {
        return this.#userData.visualMode || 'light';
    }
    set visual_mode (value) {
        if (!['light', 'dark'].includes(value)) return;

        this.#setUserData('visualMode', value);
    }
    get theme_color () {
        return {
            light: '#fffafa',
            dark:  '#202020'
        }[this.visual_mode];
    }

    get is_sidebar_collapse () {
        return this.#userData.isSidebarCollapse || false;
    }
    set is_sidebar_collapse (value) {
        if (!typeof value === 'boolean') return;

        this.#setUserData('isSidebarCollapse', value);
    }
}
const session = async () => {
    const cookiesStore = await cookies();
    return new Session(cookiesStore);
};



export default session;
