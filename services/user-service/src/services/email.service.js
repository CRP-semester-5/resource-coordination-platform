import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

/**
 * email.service.js
 *
 * Sends transactional emails via Nodemailer.
 *
 * Development: If SMTP_USER is not configured, automatically creates an
 * Ethereal (fake) account and logs the preview URL so you can inspect
 * emails without a real inbox.
 *
 * Production: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.
 */

let _transporter = null

async function getTransporter() {
    if (_transporter) return _transporter

    if (!env.smtpUser) {
        // Auto-create a temporary Ethereal test account
        const testAccount = await nodemailer.createTestAccount()
        console.log('📧  Ethereal email account created:')
        console.log(`    User: ${testAccount.user}`)
        console.log(`    Pass: ${testAccount.pass}`)
        console.log(`    Web:  https://ethereal.email/login`)

        _transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        })
    } else {
        _transporter = nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpPort === 465,
            auth: { user: env.smtpUser, pass: env.smtpPass },
        })
    }

    return _transporter
}

async function send({ to, subject, html }) {
    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: env.emailFrom,
        to,
        subject,
        html,
    })

    // In dev, print a preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
        console.log(`📧  Email preview: ${previewUrl}`)
    }

    return info
}

/**
 * Send account verification email.
 * @param {string} email  - recipient email
 * @param {string} token  - 64-char hex verification token
 */
export async function sendVerificationEmail(email, token) {
    // Points to the API's GET endpoint — works immediately without a frontend.
    // When the React app is live, change this to: ${env.frontendUrl}/verify-email?token=${token}
    const link = `http://localhost:3001/api/v1/auth/verify-email?token=${token}`


    await send({
        to: email,
        subject: 'Verify your ResQ Hub account',
        html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
                <h2 style="color:#e53e3e">ResQ Hub</h2>
                <p>Thank you for registering. Please verify your email address to activate your account.</p>
                <a href="${link}"
                   style="display:inline-block;padding:12px 24px;background:#e53e3e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
                    Verify Email Address
                </a>
                <p style="margin-top:16px;color:#666;font-size:13px">
                    This link expires in ${env.emailVerificationExpiresMinutes} minutes.<br>
                    If you did not create an account, you can ignore this email.
                </p>
                <hr style="margin-top:24px;border:none;border-top:1px solid #eee">
                <p style="color:#999;font-size:12px">ResQ Hub — Community Resilience Platform</p>
            </div>
        `,
    })
}

/**
 * Send password reset email.
 * @param {string} email  - recipient email
 * @param {string} token  - 64-char hex reset token
 */
export async function sendPasswordResetEmail(email, token) {
    const link = `${env.frontendUrl}/reset-password?token=${token}`

    await send({
        to: email,
        subject: 'Reset your ResQ Hub password',
        html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
                <h2 style="color:#e53e3e">ResQ Hub</h2>
                <p>We received a request to reset your password.</p>
                <a href="${link}"
                   style="display:inline-block;padding:12px 24px;background:#e53e3e;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
                    Reset Password
                </a>
                <p style="margin-top:16px;color:#666;font-size:13px">
                    This link expires in ${env.passwordResetExpiresMinutes} minutes.<br>
                    If you did not request a password reset, you can safely ignore this email.
                </p>
                <hr style="margin-top:24px;border:none;border-top:1px solid #eee">
                <p style="color:#999;font-size:12px">ResQ Hub — Community Resilience Platform</p>
            </div>
        `,
    })
}
