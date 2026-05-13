import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { idSchema } from '../../../../lib/schemas/zod-schemas';
import db from '../../../../lib/db';
import logger from '../../../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = idSchema.safeParse(req.query.id);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid ID' });

  const original = await db.syncLog.findUnique({
    where: { id: parsed.data },
    include: { records: { where: { status: 'failed' } } },
  });
  if (!original) return res.status(404).json({ result: 'error', message: 'Sync log not found' });

  const session = await getSession(req, res);
  const triggeredBy = session?.user?.email ?? 'Admin';

  const failedRecords = original.records;
  if (failedRecords.length === 0) {
    return res.status(400).json({ result: 'error', message: 'No failed records to retry' });
  }

  // Simulate retry — in production, call Freshworks API per record
  const start = Date.now();
  const results = failedRecords.map((r) => ({
    email: r.email,
    name: r.name ?? undefined,
    status: 'success' as const,
  }));

  try {
    const retryLog = await db.syncLog.create({
      data: {
        type: `Retry — ${original.type}`,
        triggeredBy,
        status: 'SUCCESS',
        synced: results.length,
        failed: 0,
        duration: Date.now() - start,
        records: { create: results.map((r) => ({ email: r.email, name: r.name ?? null, status: r.status })) },
      },
    });
    logger.info({ retryLogId: retryLog.id }, 'Retry sync log created');
    return res.status(200).json({ result: 'success', log: retryLog });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Retry failed' });
  }
}

export default withApiAuthRequired(handler);
