import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';

let transporter: nodemailer.Transporter | null = null;

if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export const sendVerificationEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const subject = 'Verify Your Email Address - Job Portal';
  const html = `
    <h2>Welcome to Job Portal!</h2>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verifyUrl}" target="_blank" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${verifyUrl}</p>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Verification email sent to ${to}`);
    } catch (error) {
      logger.error(`Error sending email to ${to}: ${(error as Error).message}`);
    }
  } else {
    logger.info(`[DEV SMTP FALLBACK] Email verification link for ${to}: ${verifyUrl}`);
  }
};

export const sendResetPasswordEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const subject = 'Password Reset Request - Job Portal';
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Password reset email sent to ${to}`);
    } catch (error) {
      logger.error(`Error sending reset email to ${to}: ${(error as Error).message}`);
    }
  } else {
    logger.info(`[DEV SMTP FALLBACK] Password reset link for ${to}: ${resetUrl}`);
  }
};

export const sendStatusChangeEmail = async (
  to: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string
): Promise<void> => {
  const subject = `Application Update: ${jobTitle}`;
  const html = `
    <h2>Application Status Updated</h2>
    <p>Hi ${candidateName || 'Candidate'},</p>
    <p>Your application for the position of <strong>${jobTitle}</strong> has been updated to: <strong>${newStatus.toUpperCase()}</strong>.</p>
    <p>Log in to your account to review details and track your application status.</p>
    <a href="${config.frontendUrl}/dashboard" target="_blank" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">View Dashboard</a>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Status update email sent to ${to}`);
    } catch (error) {
      logger.error(`Error sending status email to ${to}: ${(error as Error).message}`);
    }
  } else {
    logger.info(`[DEV SMTP FALLBACK] Status change email for ${to} (${jobTitle}): ${newStatus}`);
  }
};
