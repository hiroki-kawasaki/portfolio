import { NextResponse } from 'next/server';
import { importSPKI, exportJWK } from 'jose';



export async function GET() {
    const activeVersions = process.env.KEY_VERSIONS;

    if (!activeVersions) {
        console.error('KEY_VERSIONS environment variable not found');
        return NextResponse.json({ keys: [] });
    }

    const versions = activeVersions.split(',');

    const jwksPromises = versions.map(async (version) => {
        const envVarName = `RSA_PUBLIC_KEY_${version}`;
        const publicKeyPem = process.env[envVarName];

        if (!publicKeyPem) {
            console.warn(`Public key for version (kid) ${version} not found`);
            return null;
        }

        try {
            const publicKey = await importSPKI(publicKeyPem, 'RS256');
            const jwk = await exportJWK(publicKey);

            return {
                ...jwk,
                kid: version,
                use: 'sig',
                alg: 'RS256',
            };
        } catch (error) {
            console.error(`Error processing public key for version ${version}:`, error);
            return null;
        }
    });

    const resolvedJwks = await Promise.all(jwksPromises);
    const validJwks = resolvedJwks.filter(jwk => jwk !== null);

    return NextResponse.json({
        keys: validJwks,
    });
}