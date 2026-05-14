import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import db from '../../../lib/db';

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

  if (req.method === 'DELETE') {
    await db.emailAccount.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    const { isDefault, label, appPassword } = req.body;
    if (isDefault) await db.emailAccount.updateMany({ data: { isDefault: false } });
    const updated = await db.emailAccount.update({
      where: { id },
      data: { ...(label && { label }), ...(appPassword && { appPassword }), ...(isDefault !== undefined && { isDefault }) },
      select: { id: true, label: true, email: true, isDefault: true },
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
