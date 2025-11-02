import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@/config/config.service';
import { SendMailOptions } from './interfaces';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const x = this.configService.mailConfig.user;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.mailConfig.user,
        pass: this.configService.mailConfig.password,
      },
    });
  }

  async sendMail(options: SendMailOptions) {
    const mailOptions = {
      from:
        options.from ||
        `"Coupon Management System" <${this.configService.mailConfig.user}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc.join(', ')
          : options.cc
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.join(', ')
          : options.bcc
        : undefined,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${mailOptions.to}: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}:`, error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Mail server connection verified');
      return true;
    } catch (error) {
      this.logger.error('Mail server connection failed:', error);
      return false;
    }
  }
}
