import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getSession } from '@auth0/nextjs-auth0';
import db from '../../../../lib/db';
import { sendEmail } from '../../../../lib/emails';
import logger from '../../../../lib/logger';
import { idSchema } from '../../../../lib/schemas/zod-schemas';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = idSchema.safeParse(req.query.id);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid ID' });

  const log = await db.emailLog.findUnique({ where: { id: parsed.data } });
  if (!log) return res.status(404).json({ result: 'error', message: 'Log not found' });

  const session = await getSession(req, res);
  const sentBy = session?.user?.email ?? 'admin';

  try {
    await sendEmail({
      from: `LMS Admin <no-reply@${process.env.MAILGUN_DOMAIN}>`,
      to: log.to,
      subject: log.subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${log.body.replace(/\n/g, '<br/>')}</div>`,
    });

    await db.emailLog.create({
      data: { to: log.to, subject: log.subject, body: log.body, template: log.template, sentBy, status: 'SENT' },
    });

    logger.info({ to: log.to, subject: log.subject }, 'Email resent');
    return res.status(200).json({ result: 'success' });
  } catch (error) {
    logger.error(error);
    await db.emailLog.create({
      data: {
        to: log.to, subject: log.subject, body: log.body, template: log.template, sentBy,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return res.status(500).json({ result: 'error', message: 'Resend failed' });
  }
}

export default withApiAuthRequired(handler);
