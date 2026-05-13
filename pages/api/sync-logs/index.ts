import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import db from '../../../lib/db';
import logger from '../../../lib/logger';

const querySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['SUCCESS', 'PARTIAL', 'FAILED', 'ALL']).default('ALL'),
  type:   z.string().optional(),
  search: z.string().optional(),
});

const createSchema = z.object({
  type:     z.string().min(1),
  status:   z.enum(['SUCCESS', 'PARTIAL', 'FAILED']),
  synced:   z.number().int().min(0),
  failed:   z.number().int().min(0),
  duration: z.number().int().min(0),
  error:    z.string().optional(),
  records:  z.array(z.object({
    email:  z.string().email(),
    name:   z.string().optional(),
    status: z.enum(['success', 'failed']),
    error:  z.string().optional(),
  })).optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — list sync logs
  if (req.method === 'GET') {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid query' });

    const { page, limit, status, type, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (status !== 'ALL') where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { triggeredBy: { contains: search, mode: 'insensitive' } },
        { type:        { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [logs, total, successCount, partialCount, failedCount, totalSynced, totalFailed] =
        await Promise.all([
          db.syncLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
          db.syncLog.count({ where }),
          db.syncLog.count({ where: { status: 'SUCCESS' } }),
          db.syncLog.count({ where: { status: 'PARTIAL' } }),
          db.syncLog.count({ where: { status: 'FAILED'  } }),
          db.syncLog.aggregate({ _sum: { synced: true } }),
          db.syncLog.aggregate({ _sum: { failed: true } }),
        ]);

      return res.status(200).json({
        result: 'success', logs, total, successCount, partialCount, failedCount,
        totalSynced: totalSynced._sum.synced ?? 0,
        totalFailed: totalFailed._sum.failed ?? 0,
        page, limit,
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ result: 'error', message: 'Failed to fetch sync logs' });
    }
  }

  // POST — create sync log
  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid body' });

    const { type, status, synced, failed, duration, error, records } = parsed.data;
    const session = await getSession(req, res);
    const triggeredBy = req.body.triggeredBy ?? session?.user?.email ?? 'Auto';

    try {
      const log = await db.syncLog.create({
        data: {
          type, status, synced, failed, duration,
          error: error ?? null,
          triggeredBy,
          records: records?.length
            ? { create: records.map((r) => ({ email: r.email, name: r.name ?? null, status: r.status, error: r.error ?? null })) }
            : undefined,
        },
      });
      return res.status(201).json({ result: 'success', log });
    } catch (err) {
      logger.error(err);
      return res.status(500).json({ result: 'error', message: 'Failed to create sync log' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default withApiAuthRequired(handler);
