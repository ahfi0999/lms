import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import logger from '../../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const roles = await authzAdmin.getRoles();

    const rolesWithDetails = await Promise.all(
      roles.map(async (role) => {
        const [permissions, usersInRole] = await Promise.all([
          authzAdmin.getPermissionsInRole({ id: role.id! }),
          authzAdmin.getUsersInRole({ id: role.id! }),
        ]);
        return {
          id:          role.id,
          name:        role.name,
          description: role.description,
          permissions: (permissions as any[]).map((p: any) => p.permission_name as string),
          userCount:   usersInRole.length,
        };
      })
    );

    return res.status(200).json({ result: 'success', roles: rolesWithDetails });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ result: 'error', message: 'Failed to fetch roles' });
  }
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), ['admin:dashboards']);
