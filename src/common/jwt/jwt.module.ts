// src/common/modules/jwt/jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@common/modules/config/config.module';
import { ConfigService } from '@common/modules/config/config.service';

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtConfig.jwtSecret,
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  exports: [NestJwtModule], // 👈 export NestJwtModule to use JwtService in other modules
})
export class JwtConfigModule {}
