import { headers } from 'next/headers';

import crypto from 'crypto';
import { SignJWT, importPKCS8 } from 'jose';



const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = (() => {
    let keys;
    let latestKeyId;

    return (id = null) => {
        if (!keys) {
            const activeVersions = process.env.KEY_VERSIONS;
            if (!activeVersions) {
                throw new Error('KEY_VERSIONS environment variable is not set.');
            }

            latestKeyId = process.env.LATEST_KEY_VERSION;
            if (!latestKeyId) {
                throw new Error('LATEST_KEY_VERSION environment variable is not set.');
            }

            keys = new Map();
            const versions = activeVersions.split(',');

            for (const version of versions) {
                const envVarName = `AES_SYMMETRIC_KEY_${version}`;
                const keyHex = process.env[envVarName];

                if (!keyHex) {
                    throw new Error(`Symmetric key for version ${version} (${envVarName}) not found.`);
                }
                const key = Buffer.from(keyHex.trim(), 'hex');
                if (key.length !== 32) {
                    throw new Error(`Invalid key length for version "${version}". Key must be 32 bytes (64 hex characters).`);
                }
                keys.set(version, key);
            }
        }

        const keyIdToReturn = id || latestKeyId;
        const keyToReturn = keys.get(keyIdToReturn);
        
        if (!keyToReturn) {
            console.error(`Decryption key for version ${keyIdToReturn} not found in active keys.`);
            return { keyId: keyIdToReturn, key: undefined };
        }

        return { keyId: keyIdToReturn, key: keyToReturn };
    };
})();

export const encrypt = (text) => {
    const { keyId, key } = getEncryptionKey();

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    cipher.setAAD(Buffer.from(keyId, 'utf8'));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${keyId}:${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
};

export const decrypt = (encryptedText) => {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 4) return null;

        const [keyId, ivHex, encrypted, tagHex] = parts;
        const { key } = getEncryptionKey(keyId);
        if (!key) return null;

        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
            authTagLength: AUTH_TAG_LENGTH,
        });

        decipher.setAAD(Buffer.from(keyId, 'utf8'));
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        return null;
    }
};



const getLatestPrivateKey = (() => {
    let cachedKey;
    let cachedVersion;

    return async () => {
        const latestVersion = process.env.LATEST_KEY_VERSION;
        if (!latestVersion) {
            throw new Error('LATEST_KEY_VERSION environment variable not set.');
        }

        if (cachedKey && cachedVersion === latestVersion) {
            return { privateKey: cachedKey, kid: cachedVersion };
        }

        const envVarName = `RSA_PRIVATE_KEY_${latestVersion}`;
        const privateKeyPem = process.env[envVarName];
        if (!privateKeyPem) {
            throw new Error(`Private key for latest version ${latestVersion} (${envVarName}) not found.`);
        }

        const privateKey = await importPKCS8(privateKeyPem, 'RS256');
        cachedKey = privateKey;
        cachedVersion = latestVersion;

        return { privateKey, kid: latestVersion };
    };
})();

export const signature = (() => {
    let cachedToken;
    let cachedExpiresAt = 0;
    const CACHE_TTL = 180000;

    return async () => {
        if (cachedToken && Date.now() < cachedExpiresAt) return cachedToken;
    
        const headersList = await headers();
        const hostName = headersList.get('host');

        const { privateKey, kid } = await getLatestPrivateKey();

        const payload = {client_id: 'portfolio-web', iss: 'https://'+hostName, aud: 'portfolio'};

        const jwt = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256', kid })
            .setIssuedAt()
            .setExpirationTime('5m')
            .sign(privateKey);

        cachedToken = jwt;
        cachedExpiresAt = Date.now() + CACHE_TTL;

        return jwt;
    };
})();