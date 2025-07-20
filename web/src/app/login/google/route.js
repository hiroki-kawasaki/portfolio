import { redirect } from 'next/navigation';

const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;



export async function GET(request) {
    const host = request.headers.get('host');

    const redirectUri = `https://${host}/login/callback`;
    const responseType = 'code';
    const scope = 'openid email profile';
    const loginUrl = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&response_type=${responseType}&client_id=${COGNITO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    return redirect(loginUrl);
}
