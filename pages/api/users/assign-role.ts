import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { z } from 'zod';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import logger from '../../../lib/logger';

const schema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ result: 'error', message: 'Invalid input' });

  const { userId, roleId } = parsed.data;

  try {
    // Remove all existing roles then assign the new one
    const currentRoles = await authzAdmin.getUserRoles({ id: userId });
    if (currentRoles.length > 0) {
      await authzAdmin.removeRolesFromUser(
        { id: userId },
        { roles: currentRoles.map((r) => r.id!).filter(Boolean) }
      );
    }
    await authzAdmin.assignRolestoUser({ id: userId }, { roles: [roleId] });
    logger.info({ userId, roleId }, 'Role assigned to user');
    return res.status(200).json({ result: 'success' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Failed to assign role' });
  }
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), ['admin:dashboards']);
