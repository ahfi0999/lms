import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import db from '../../../lib/db';
import nodemailer from 'nodemailer';

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const account = await db.emailAccount.findFirst({ where: { isDefault: true } });
  if (!account) return res.status(404).json({ error: 'No account found' });

  const pass = account.appPassword.replace(/\s/g, '');

  const transport = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: { user: account.email, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transport.verify();
    return res.status(200).json({ ok: true, email: account.email, host: account.smtpHost, port: account.smtpPort });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      code: err.code,
      email: account.email,
      host: account.smtpHost,
      port: account.smtpPort,
      passLength: pass.length,
    });
  }
});
