import { IsString, IsNotEmpty } from 'class-validator';

export class MailConfigDto {
  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
