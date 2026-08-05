import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      logger.info('🚀 Official Resend SDK initialized as primary email provider.');
      this.resend = new Resend(env.RESEND_API_KEY);
    } else {
      logger.warn('⚠️ RESEND_API_KEY is not set. Resend email dispatch will run in mock mode in non-production environment.');
    }
  }

  private getResendInstance(): Resend {
    if (this.resend) return this.resend;
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      return this.resend;
    }
    if (env.NODE_ENV === 'production') {
      throw new Error('FATAL: RESEND_API_KEY is required in production environment.');
    }
    // Return a mock instance for test/dev environment if key absent
    return new Resend('re_mock_development_key');
  }

  private getFromAddress(): string {
    if (env.RESEND_FROM && !env.RESEND_FROM.includes('noreply@jobportal.com')) {
      return env.RESEND_FROM;
    }
    return 'Job Portal <onboarding@resend.dev>';
  }

  async sendEmail(to: string, subject: string, html: string): Promise<string> {
    const from = this.getFromAddress();
    logger.info(`📨 Sending email via Resend\n   Recipient: ${to}\n   Subject: ${subject}\n   From: ${from}`);

    if (env.NODE_ENV === 'test' || (!env.RESEND_API_KEY && env.NODE_ENV !== 'production')) {
      const mockId = `mock_resend_id_${Date.now()}`;
      logger.info(`✅ Verification email sent (Dev/Test Mock)\n   Resend Email ID: ${mockId}`);
      return mockId;
    }

    try {
      const resend = this.getResendInstance();
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        logger.error(`❌ Resend API Error\n   Name: ${error.name}\n   Message: ${error.message}`);
        throw new Error(`Resend email dispatch failed: ${error.message}`);
      }

      const emailId = data?.id || 'unknown_id';
      logger.info(`✅ Verification email sent\n   Resend Email ID: ${emailId}`);
      return emailId;
    } catch (err: any) {
      logger.error(`❌ Resend API Error\n   Message: ${err.message || err}`);
      throw err;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
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

  async sendResendVerificationEmail(to: string, token: string): Promise<void> {
    await this.sendVerificationEmail(to, token);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
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

  async sendWelcomeEmail(to: string, name: string = 'User'): Promise<void> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2b6cb0; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Welcome to Job Portal, ${name}!</h2>
        <p style="color: #4a5568; font-size: 16px;">Your account has been successfully verified and activated.</p>
        <p style="color: #4a5568; font-size: 16px;">You can now log in, explore open job postings, update your profile, and manage your applications.</p>
      </div>
    `;
    await this.sendEmail(to, 'Welcome to Job Portal!', html);
  }

  async sendEmployerApprovalEmail(to: string, name: string = 'Employer'): Promise<void> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #276749; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Employer Profile Approved</h2>
        <p style="color: #4a5568; font-size: 16px;">Dear ${name},</p>
        <p style="color: #4a5568; font-size: 16px;">Your employer organization account has been reviewed and verified by platform administrators.</p>
        <p style="color: #4a5568; font-size: 16px;">You now have full access to publish job listings and view applicant resumes.</p>
      </div>
    `;
    await this.sendEmail(to, 'Employer Account Approved', html);
  }

  async sendApplicationStatusUpdate(to: string, jobTitle: string, status: string, candidateName: string = 'Candidate'): Promise<void> {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2b6cb0; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Application Status Updated</h2>
        <p style="color: #4a5568; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #4a5568; font-size: 16px;">The status of your job application for position <strong>${jobTitle}</strong> was updated to: <strong>${status}</strong>.</p>
      </div>
    `;
    await this.sendEmail(to, `Application Update: ${jobTitle}`, html);
  }
}

export const emailService = new EmailService();
