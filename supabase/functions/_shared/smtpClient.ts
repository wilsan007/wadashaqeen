import { createTransport } from 'npm:nodemailer@6.9.13';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const smtpHost = Deno.env.get('SMTP_HOST');
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');
  const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error(
      'Missing SMTP configuration. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
    );
    throw new Error('SMTP configuration is missing');
  }

  const transporter = createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: options.from || smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text, // Optional plain text version
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    throw error;
  }
};
