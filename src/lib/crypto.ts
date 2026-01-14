import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    // Use SHA-256 to ensure key is exactly 32 bytes
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded string containing IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag into a single base64 string
    const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * @param ciphertext - Base64 encoded string from encrypt()
 * @returns The original plaintext
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');

    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

/**
 * Check if a string looks like it's encrypted (base64 with correct length)
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;
    try {
        const decoded = Buffer.from(value, 'base64');
        // Minimum length: IV (16) + at least 1 byte data + tag (16) = 33 bytes
        return decoded.length >= 33;
    } catch {
        return false;
    }
}
