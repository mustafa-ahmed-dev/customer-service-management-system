import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum Env {
  development = 'development',
  testing = 'testing',
  production = 'production',
}

export class AppConfigDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsNotEmpty()
  @IsString()
  host: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(Env)
  env: Env;

  @IsNotEmpty()
  @IsString()
  protocol: string;

  @IsNotEmpty()
  @IsString()
  uploadedFilesDestination: string;

  @IsNotEmpty()
  @IsString()
  // @IsUrl() // FIXME
  apiBaseUrl: string;

  @IsNotEmpty()
  @IsString()
  timezone: string;
}
