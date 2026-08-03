import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    // If SMTP host or user is not configured in environment, create an Ethereal mock account on-the-fly
    if (!env.SMTP_HOST || !env.SMTP_USER) {
      logger.info('SMTP host or user not configured. Establishing dynamic Ethereal Mail mock SMTP...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info(`Dynamic Ethereal SMTP established. User: ${testAccount.user}`);
        return this.transporter;
      } catch (err) {
        logger.error('Failed to establish dynamic Ethereal SMTP, creating dummy offline transport...', err);
        // Fallback dummy transport to avoid crashing
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
        return this.transporter;
      }
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // Secure connection for standard secure port
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });

      logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);

      // Log Ethereal preview link if generated
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`✉️ [Mock Email] Preview URL: ${previewUrl}`);
      }
    } catch (error) {
      logger.error(`Error encountered while sending email to ${to}:`, error);
      if (env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    logger.info(`✉️  [Dev Helper] Verification Link for ${to}: ${verificationLink}`);
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1a202c; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Welcome to Job Portal!</h2>
        <p style="color: #4a5568; font-size: 16px;">We are excited to have you join us. Please verify your email address to complete registration:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationLink}" style="background-color: #3182ce; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Your Email</a>
        </div>
        <p style="color: #718096; font-size: 14px;">Alternatively, copy and paste this verification URL into your browser:</p>
        <p style="word-break: break-all; color: #3182ce; font-size: 14px;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #a0aec0;">This verification link will expire in 24 hours. If you did not create this account, you can safely ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, 'Verify Your Email Address', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    logger.info(`✉️  [Dev Helper] Password Reset Link for ${to}: ${resetLink}`);
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1a202c; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Password Reset Request</h2>
        <p style="color: #4a5568; font-size: 16px;">We received a request to reset your password. Click the button below to specify a new password:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #e53e3e; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #718096; font-size: 14px;">Alternatively, copy and paste this reset URL into your browser:</p>
        <p style="word-break: break-all; color: #3182ce; font-size: 14px;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #a0aec0;">This password reset link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, 'Reset Your Password', html);

  }

  async sendApplicationStatusUpdate(to: string, jobTitle: string, status: string, candidateName: string = 'Candidate'): Promise<void> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2b6cb0; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Application Status Updated</h2>
        <p style="color: #4a5568; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #4a5568; font-size: 16px;">The status of your job application for the position of <strong>${jobTitle}</strong> has been updated to:</p>
        <div style="margin: 25px 0; text-align: center;">
          <span style="background-color: #ebf8ff; color: #2b6cb0; padding: 10px 24px; border-radius: 30px; font-weight: 700; font-size: 18px; border: 1px dashed #bee3f8; text-transform: uppercase;">
            ${status}
          </span>
        </div>
        <p style="color: #4a5568; font-size: 16px;">We will keep you informed of further updates.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
        <p style="font-size: 12px; color: #a0aec0;">You are receiving this message because you applied to this job posting on our platform.</p>
      </div>
    `;
    await this.sendEmail(to, `Application Update: ${jobTitle}`, html);
  }
}

export const emailService = new EmailService();
