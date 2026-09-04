import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = "noreply@seorchable.com"; // Replace with verified domain

/**
 * Helper to wrap content in a generic RTL Persian HTML template.
 */
function getBaseTemplate(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Tahoma, Arial, sans-serif;
          background-color: #f9fafb;
          color: #1f2937;
          margin: 0;
          padding: 20px;
          direction: rtl;
          text-align: right;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 32px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #111827;
          font-size: 24px;
          margin-bottom: 24px;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .btn {
          display: inline-block;
          background-color: #3b82f6;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 16px;
          margin-bottom: 16px;
        }
        .footer {
          margin-top: 32px;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        ${content}
        <div class="footer">
          <p>با تشکر،<br>تیم پشتیبانی SEOrchable</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Core function to send emails using Resend or fallback to console log.
 */
async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn("[Email Utility] RESEND_API_KEY is not configured.");
    console.warn(`[Email Utility] Mocking email send to: ${to}`);
    console.warn(`[Email Utility] Subject: ${subject}`);
    console.log(`[Email Utility] HTML Content:\n${html}\n`);
    return { success: true, mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email Utility] Failed to send email via Resend:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Email Utility] Unexpected error sending email:", error);
    return { success: false, error };
  }
}

/**
 * Sends a verification email (link or code).
 */
export async function sendVerificationEmail(email: string, name: string, verificationLink: string) {
  const subject = "تایید آدرس ایمیل - SEOrchable";
  const content = `
    <p>سلام ${name} عزیز،</p>
    <p>به SEOrchable خوش آمدید! برای تایید آدرس ایمیل خود و فعال‌سازی حساب کاربری، لطفاً روی دکمه زیر کلیک کنید:</p>
    <a href="${verificationLink}" class="btn">تایید ایمیل</a>
    <p>اگر دکمه بالا کار نمی‌کند، می‌توانید لینک زیر را در مرورگر خود کپی و پیست کنید:</p>
    <p dir="ltr" style="text-align: left; word-break: break-all; color: #3b82f6;">${verificationLink}</p>
    <p>اگر شما این درخواست را نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
  `;

  const html = getBaseTemplate(subject, content);
  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const subject = "بازیابی رمز عبور - SEOrchable";
  const content = `
    <p>کاربر گرامی،</p>
    <p>ما درخواستی مبنی بر تغییر رمز عبور حساب کاربری شما دریافت کرده‌ایم. برای تنظیم مجدد رمز عبور، روی دکمه زیر کلیک کنید:</p>
    <a href="${resetLink}" class="btn">بازیابی رمز عبور</a>
    <p>این لینک به مدت ۱ ساعت معتبر خواهد بود.</p>
    <p>اگر دکمه بالا کار نمی‌کند، لینک زیر را در مرورگر خود باز کنید:</p>
    <p dir="ltr" style="text-align: left; word-break: break-all; color: #3b82f6;">${resetLink}</p>
    <p>اگر شما درخواست تغییر رمز عبور نداده‌اید، نیاز به انجام هیچ کاری نیست و حساب شما امن است.</p>
  `;

  const html = getBaseTemplate(subject, content);
  return sendEmail({ to: email, subject, html });
}
