import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ConfigService as NestConfigService } from '@nestjs/config';

import { ConfigDto } from './dto/config.dto';
import { AppConfigDto, Env } from './dto/app-config.dto';
import { DatabaseConfigDto } from './dto/database-config.dto';
import { JWTConfigDto } from './dto/jwt-config.dto';
import { MailConfigDto } from './dto/mail-config.dto';

@Injectable()
export class ConfigService {
  config: ConfigDto;

  constructor(private readonly configService: NestConfigService) {
    this.config = this.validateConfig();
  }

  get appConfig(): AppConfigDto {
    return this.config.app;
  }

  get databaseConfig(): DatabaseConfigDto {
    return this.config.database;
  }

  get jwtConfig(): JWTConfigDto {
    return this.config.jwt;
  }

  get mailConfig(): MailConfigDto {
    return this.config.mail;
  }

  private loadAppConfigData(): AppConfigDto {
    return {
      env: this.loadEnv(),
      host: this.configService.get<string>('APP_HOST'),
      name: this.configService.get<string>('APP_NAME'),
      port: parseInt(this.configService.get<string>('APP_PORT'), 10),
      protocol: this.configService.get<string>('PROTOCOL'),
      apiBaseUrl: this.configService.get<string>('API_BASE_URL'),
      uploadedFilesDestination: this.configService.get<string>(
        'UPLOADED_FILES_DESTINATION',
      ),
      timezone: this.configService.get<string>('TIMEZONE'),
    };
  }

  private loadMailConfigData(): MailConfigDto {
    return {
      user: this.configService.get<string>('MAIL_USER'),
      password: this.configService.get<string>('MAIL_APP_PASSWORD'),
    };
  }

  private loadDatabaseConfigData(): DatabaseConfigDto {
    return {
      databaseUrl: this.configService.get<string>('DATABASE_URL'),
      name: this.configService.get<string>('POSTGRES_DB'),
      user: this.configService.get<string>('POSTGRES_USER'),
      host: this.configService.get<string>('POSTGRES_HOST'),
      password: this.configService.get<string>('POSTGRES_PASSWORD'),
      port: parseInt(this.configService.get<string>('POSTGRES_PORT'), 10),
      schema: this.configService.get<string>('POSTGRES_SCHEMA'),
    };
  }

  private loadJWTConfigData(): JWTConfigDto {
    return {
      secret: this.configService.get<string>('JWT_SECRET'),
      expirationDuration: this.configService.get<string>(
        'JWT_EXPIRATION_DURATION',
      ),
      //   jwtAccessTokenSecret: this.configService.get<string>(
      //     'JWT_ACCESS_TOKEN_SECRET',
      //   ),
      //   jwtAccessTokenExpirationTime: this.configService.get<string>(
      //     'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      //   )
      //     ? parseInt(
      //         this.configService.get<string>(
      //           'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      //         ) as string,
      //         10,
      //       )
      //     : 15 * 60, // 15 minutes
      //   jwtRefreshTokenSecret: this.configService.get<string>(
      //     'JWT_REFRESH_TOKEN_SECRET',
      //   ),
      //   jwtRefreshTokenExpirationTime: this.configService.get<string>(
      //     'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      //   )
      //     ? parseInt(
      //         this.configService.get<string>(
      //           'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      //         ) as string,
      //         10,
      //       )
      //     : 60 * 60 * 24 * 7, // 7 days
    };
  }

  private loadEnv(): Env {
    const env = this.configService.get<string>('NODE_ENV') ?? Env.development;

    switch (env) {
      case 'production':
      case 'prod':
        return Env.production;
      case 'testing':
      case 'test':
        return Env.testing;
      case 'development':
      case 'dev':
      default:
        return Env.development;
    }
  }

  private loadConfigData(): ConfigDto {
    return {
      app: this.loadAppConfigData(),
      database: this.loadDatabaseConfigData(),
      jwt: this.loadJWTConfigData(),
      mail: this.loadMailConfigData(),
    };
  }

  private validateConfig(): ConfigDto {
    const config: ConfigDto = this.loadConfigData();

    const configInstance = plainToClass(ConfigDto, config);
    const errors = validateSync(configInstance);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
        })
        .join('\n');

      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }

    return config;
  }
}
