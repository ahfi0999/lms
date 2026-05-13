import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import { sendEmail } from '../../../lib/emails';
import logger from '../../../lib/logger';
import db from '../../../lib/db';
import { getSession } from '@auth0/nextjs-auth0';

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  template: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const result = sendEmailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ result: 'error', message: 'Invalid input' });
  }

  const { to, subject, body, template } = result.data;
  const session = await getSession(req, res);
  const sentBy = session?.user?.email ?? 'admin';

  try {
    await sendEmail({
      from: `LMS Admin <no-reply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
    });

    await db.emailLog.create({
      data: { to, subject, body, template: template ?? null, sentBy, status: 'SENT' },
    });

    logger.info({ to, subject }, 'Email sent');
    return res.status(200).json({ result: 'success' });
  } catch (error) {
    logger.error(error);
    await db.emailLog.create({
      data: {
        to,
        subject,
        body,
        template: template ?? null,
        sentBy,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    return res.status(500).json({ result: 'error', message: 'Failed to send email' });
  }
}

export default withApiAuthRequired(handler);
