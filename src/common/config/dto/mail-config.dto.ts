import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class MailConfigDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => {
    return value.split(',');
  })
  @IsString({ each: true })
  notificationsEmails: string[];
}
