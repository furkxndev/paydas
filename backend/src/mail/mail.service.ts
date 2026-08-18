import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { AppConfig } from '../config/configuration';

/**
 * E-posta gönderimi.
 * SMTP yapılandırılmamışsa (geliştirme ortamı) e-posta gönderilmez;
 * bağlantı loglanır ki akış test edilebilsin.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const smtp = this.config.get<AppConfig['smtp']>('smtp')!;
    if (smtp.host && smtp.user) {
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.password },
      });
    } else {
      this.logger.warn(
        'SMTP yapılandırılmadı. E-postalar gönderilmeyecek, bağlantılar loga yazılacak.',
      );
    }
  }

  private get appName(): string {
    return 'Paydaş';
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[E-POSTA GÖNDERİLMEDİ] ${to} · ${subject}\n${text}`);
      return;
    }
    try {
      const smtp = this.config.get<AppConfig['smtp']>('smtp')!;
      await this.transporter.sendMail({ from: smtp.from, to, subject, text });
    } catch (error) {
      // E-posta gönderilemese de çağıran akış bozulmamalı
      this.logger.error(
        `E-posta gönderilemedi (${to}): ${error instanceof Error ? error.message : 'bilinmeyen hata'}`,
      );
    }
  }

  async sendPasswordReset(
    to: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const link = `${this.config.get<AppConfig['appUrl']>('appUrl')}/sifre-sifirla?token=${token}`;
    await this.send(
      to,
      `${this.appName} · Şifre sıfırlama`,
      [
        `Merhaba ${fullName},`,
        '',
        `${this.appName} hesabınız için şifre sıfırlama talebi aldık.`,
        'Aşağıdaki bağlantıyla yeni bir şifre belirleyebilirsiniz:',
        '',
        link,
        '',
        `Bağlantı 1 saat geçerlidir. Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz;`,
        'şifreniz değişmez.',
      ].join('\n'),
    );
  }

  async sendEmailVerification(
    to: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const link = `${this.config.get<AppConfig['appUrl']>('appUrl')}/eposta-dogrula?token=${token}`;
    await this.send(
      to,
      `${this.appName} · E-posta adresinizi doğrulayın`,
      [
        `Merhaba ${fullName},`,
        '',
        `${this.appName}'a hoş geldiniz. E-posta adresinizi doğrulamak için:`,
        '',
        link,
        '',
        'Bağlantı 24 saat geçerlidir.',
      ].join('\n'),
    );
  }
}
