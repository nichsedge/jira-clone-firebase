
'use client';

import { EmailSettings } from './types';
import { AES, enc } from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-that-is-not-very-secret';
const STORAGE_KEY = 'proflow-email-settings';

/**
 * Saves email settings to localStorage after encrypting them.
 * @param settings - The email settings to save.
 */
export function saveEmailSettings(settings: EmailSettings): void {
  if (typeof window !== 'undefined') {
    try {
      const ciphertext = AES.encrypt(JSON.stringify(settings), ENCRYPTION_KEY).toString();
      localStorage.setItem(STORAGE_KEY, ciphertext);
    } catch (error) {
      console.error("Could not save email settings:", error);
    }
  }
}

/**
 * Retrieves and decrypts email settings from localStorage.
 * @returns The decrypted email settings, or null if not found or on error.
 */
export function getEmailSettings(): EmailSettings | null {
  if (typeof window !== 'undefined') {
    try {
      const ciphertext = localStorage.getItem(STORAGE_KEY);
      if (ciphertext === null) {
        return null;
      }
      const bytes = AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decryptedData = JSON.parse(bytes.toString(enc.Utf8));
      return decryptedData;
    } catch (error) {
      console.error("Could not retrieve or decrypt email settings:", error);
      // If decryption fails, it might be because of old data.
      // We can clear it to prevent persistent errors.
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
  return null;
}

/**
 * Removes the email settings from localStorage.
 */
export function clearEmailSettings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
