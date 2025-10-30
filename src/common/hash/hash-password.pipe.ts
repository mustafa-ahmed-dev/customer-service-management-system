import { PipeTransform, Injectable } from '@nestjs/common';
import argon2 from 'argon2';

@Injectable()
export class HashPasswordPipe implements PipeTransform {
  // No constructor needed here, unless you want to inject services later
  constructor() {}

  // Use generic T to preserve original DTO structure
  async transform<
    T extends {
      password?: string;
      passwordConfirm?: string;
    },
  >(value: T): Promise<T> {
    // Only hash if a password is provided
    if (value.password) {
      // Hash password securely
      value.password = await argon2.hash(value.password);

      // Optional: remove passwordConfirm from request payload before it hits the service
      delete value.passwordConfirm;
    }

    // Return transformed (hashed) DTO
    return value;
  }
}
