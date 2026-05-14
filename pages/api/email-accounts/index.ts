import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import db from '../../../lib/db';

const createSchema = z.object({
  label: z.string().min(1),
  email: z.string().email(),
  appPassword: z.string().min(1),
  imapHost: z.string().optional(),
  imapPort: z.number().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const accounts = await db.emailAccount.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, label: true, email: true, isDefault: true, imapHost: true, imapPort: true, smtpHost: true, smtpPort: true },
    });
    return res.status(200).json(accounts);
  }

  if (req.method === 'POST') {
    const result = createSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: 'Invalid input' });

    const data = result.data;
    if (data.isDefault) {
      await db.emailAccount.updateMany({ data: { isDefault: false } });
    }

    const account = await db.emailAccount.create({ data: { ...data, appPassword: data.appPassword.replace(/\s/g, ''), imapHost: data.imapHost ?? 'imap.gmail.com', imapPort: data.imapPort ?? 993, smtpHost: data.smtpHost ?? 'smtp.gmail.com', smtpPort: data.smtpPort ?? 587, isDefault: data.isDefault ?? false } });
    return res.status(201).json({ id: account.id, label: account.label, email: account.email, isDefault: account.isDefault });
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
