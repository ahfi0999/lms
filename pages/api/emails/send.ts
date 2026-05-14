import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import { sendEmail } from '../../../lib/emails';
import logger from '../../../lib/logger';
import db from '../../../lib/db';
import { getSession } from '@auth0/nextjs-auth0';
import { sendFromAccount } from '../../../lib/smtp-sender';

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  template: z.string().optional(),
  accountId: z.number().optional(),
  inReplyTo: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const result = sendEmailSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ result: 'error', message: 'Invalid input' });

  const { to, subject, body, template, accountId, inReplyTo } = result.data;
  const session = await getSession(req, res);
  const sentBy = session?.user?.email ?? 'admin';

  try {
    const account = accountId
      ? await db.emailAccount.findUnique({ where: { id: accountId } })
      : await db.emailAccount.findFirst({ where: { isDefault: true } });

    console.log('[send] accountId from request:', accountId);
    console.log('[send] account found:', account ? `id=${account.id} email=${account.email}` : 'null — falling back to Mailgun');

    if (account) {
      await sendFromAccount({ account, to, subject, body, inReplyTo });
    } else {
      await sendEmail({
        from: `LMS Admin <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to,
        subject,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
      });
    }

    await db.emailLog.create({
      data: { to, subject, body, template: template ?? null, sentBy, status: 'SENT' },
    });

    logger.info({ to, subject }, 'Email sent');
    return res.status(200).json({ result: 'success' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send] ERROR:', errMsg);
    logger.error(error);
    await db.emailLog.create({
      data: { to, subject, body, template: template ?? null, sentBy, status: 'FAILED', error: errMsg },
    }).catch(() => {});
    return res.status(500).json({ result: 'error', message: errMsg });
  }
}

export default withApiAuthRequired(handler);
