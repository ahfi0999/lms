import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import db from '../../../lib/db';
import logger from '../../../lib/logger';

const querySchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().positive().max(100).default(20),
  status:   z.enum(['SENT', 'FAILED', 'ALL']).default('ALL'),
  search:   z.string().optional(),
  template: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid query' });

  const { page, limit, status, search, template } = parsed.data;
  const skip = (page - 1) * limit;

  const where: { status?: 'SENT' | 'FAILED'; template?: string; OR?: object[] } = {};
  if (status !== 'ALL') where.status = status;
  if (template) where.template = template;
  if (search) {
    where.OR = [
      { to:      { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { sentBy:  { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [logs, total, sentCount, failedCount] = await Promise.all([
      db.emailLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      db.emailLog.count({ where }),
      db.emailLog.count({ where: { status: 'SENT' } }),
      db.emailLog.count({ where: { status: 'FAILED' } }),
    ]);

    return res.status(200).json({ result: 'success', logs, total, sentCount, failedCount, page, limit });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Failed to fetch email logs' });
  }
}

export default withApiAuthRequired(handler);
