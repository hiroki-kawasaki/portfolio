import session from '@f-s/session';
import { signature } from '@f-s/crypto';



class Cognito {
    #domain
    #client_id
    #client_secret

    #headers

    constructor () {
        this.#domain = process.env.COGNITO_DOMAIN;
        this.#client_id = process.env.COGNITO_CLIENT_ID;
        this.#client_secret = process.env.COGNITO_SECRET;
    }

    get domain () { return this.#domain }
    get client_id () { return this.#client_id }

    get headers () {
        if (!this.#headers) this.#headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.client_id}:${this.#client_secret}`).toString('base64')
        };

        return this.#headers;
    }
    get token_url () {
        return this.domain + '/oauth2/token';
    }
    get revoke_url () {
        return this.domain + '/oauth2/revoke';
    }

    options (body) {
        return {
            method: 'POST',
            headers: this.headers,
            body: new URLSearchParams({
                client_id: this.client_id,
                ...body
            })
        };
    }
    async authorization (code, redirect_uri) {
        return await fetch(this.token_url, this.options({
            grant_type: 'authorization_code',
            code,
            redirect_uri
        }));
    }
    async refresh (token) {
        return await fetch(this.token_url, this.options({
            grant_type: 'refresh_token',
            refresh_token: token
        }));
    }
    async revoke (token) {
        return await fetch(this.token_url, this.options({token}));
    }
}
export const cognito = (() => {
    let instance;

    return () => {
        if (!instance) instance = new Cognito();
        return instance;
    };
})();



class PortfolioApi {
    #name
    #base_path

    constructor (name) {
        if (typeof name !== 'string') throw new Error('Invalid name.');

        this.#name = name.toLowerCase();
        const appStage = process.env.APP_STAGE.toLowerCase();
        const domain = this.name + (appStage != 'prd' ? `.${appStage}` : '') + '.portfolio.com';
        this.#base_path = 'https://' + domain;
    }

    get name () { return this.#name }
    get base_path () { return this.#base_path }

    url_for (path, query=null) {
        let url = this.base_path + path;
        if (query) {
            const searchParams = new URLSearchParams(query);
            const queryStrings = searchParams.toString();
            if (queryStrings) url += `?${queryStrings}`;
        }
        return url;
    }

    async fetch (method, path, {query, body} = {}) {
        method = method.toUpperCase();
        const sessionStore = await session();
        let url = this.url_for(path, query);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStore.access_token}`,
            'X-Server-Signature': await signature()
        };
        const options = {method, headers};
        if (method !== 'GET' && body) options.body = JSON.stringify(body);
        const res = await fetch(url, options);
        if (!res.ok) return {ok: false, status: res.status};

        const json = await res.json();
        return {
            ok: true,
            status: res.status,
            data: json
        };
    }

    async get (path, {query}={}) {
        return await this.fetch('GET', path, {query});
    }

    async post (path, {query, body}={}) {
        return await this.fetch('POST', path, {query, body});
    }

    async put (path, {query, body}={}) {
        return await this.fetch('PUT', path, {query, body});
    }

    async patch (path, {query, body}={}) {
        return await this.fetch('PATCH', path, {query, body});
    }

    async delete (path) {
        return await this.fetch('DELETE', path);
    }
}
const api = (() => {
    const instances = new Map();

    return (name) => {
        if (!instances.has(name)) instances.set(name, new PortfolioApi(name));
        return instances.get(name);
    };
})();

export default api;
