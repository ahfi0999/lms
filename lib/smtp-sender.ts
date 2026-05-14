import nodemailer from 'nodemailer';

type SendOptions = {
  account: { email: string; appPassword: string; smtpHost: string; smtpPort: number };
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
};

export async function sendFromAccount({ account, to, subject, body, inReplyTo }: SendOptions) {
  const pass = account.appPassword.replace(/\s/g, '');
  const transport = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: { user: account.email, pass },
    tls: { rejectUnauthorized: false },
  });

  await transport.sendMail({
    from: account.email,
    to,
    subject,
    text: body,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
    ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
  });
}
