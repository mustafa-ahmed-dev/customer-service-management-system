import { IsNotEmpty, IsString } from 'class-validator';

export class JWTConfigDto {
  @IsNotEmpty()
  @IsString()
  jwtSecret: string;

  @IsNotEmpty()
  @IsString()
  jwtExpirationDuration: string;

  // @IsNotEmpty()
  // @IsString()
  // jwtAccessTokenSecret: string;

  // @IsNotEmpty()
  // @IsString()
  // jwtAccessTokenExpirationDuration: string;

  // @IsNotEmpty()
  // @IsString()
  // jwtRefreshTokenSecret: string;

  // @IsNotEmpty()
  // @IsString()
  // jwtRefreshTokenExpirationDuration: string;
}
