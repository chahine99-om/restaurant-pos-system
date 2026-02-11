import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.MAIL_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: process.env.MAIL_SECURE === 'true',
        auth:
          process.env.MAIL_USER && process.env.MAIL_PASS
            ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
            : undefined,
      });
    }
  }

  /** Send verification email, or in dev without SMTP log the link and return it. */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<{ sent: boolean; link?: string }> {
    const subject = 'Verify your email – Restaurant POS';
    const html = `
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires in 24 hours.</p>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@restaurant.local',
        to,
        subject,
        html,
      });
      return { sent: true };
    }
    // No SMTP: log for dev/testing and return link so API can include it in response
    console.log(`[Mail] Verification link for ${to}: ${verificationLink}`);
    return { sent: false, link: verificationLink };
  }
}
