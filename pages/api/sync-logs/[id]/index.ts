import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { idSchema } from '../../../../lib/schemas/zod-schemas';
import db from '../../../../lib/db';
import logger from '../../../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = idSchema.safeParse(req.query.id);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid ID' });

  try {
    const log = await db.syncLog.findUnique({
      where: { id: parsed.data },
      include: { records: { orderBy: { status: 'asc' } } },
    });
    if (!log) return res.status(404).json({ result: 'error', message: 'Sync log not found' });
    return res.status(200).json({ result: 'success', log });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Failed to fetch sync log' });
  }
}

export default withApiAuthRequired(handler);
