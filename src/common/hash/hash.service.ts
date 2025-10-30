import {
  Global,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import argon2 from 'argon2';

@Global()
@Injectable()
export class HashService {
  /**
   * Hashes a password using Argon2.
   * @param password - The password to hash.
   * @returns A promise that resolves to the hashed password.
   */
  async hash(raw: string): Promise<string> {
    try {
      return await argon2.hash(raw);
    } catch (error) {
      throw new InternalServerErrorException(error, 'Hashing failed');
    }
  }

  /**
   * Verifies a password against a hashed password.
   * @param password - The plain text password to verify.
   * @param hash - The hashed password to verify against.
   * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
   */
  async verify(raw: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await argon2.verify(hash, raw);
      return isMatch;
    } catch (error) {
      // This only runs if verify() throws unexpectedly
      throw new InternalServerErrorException(error, 'Verification failed');
    }
  }
}
