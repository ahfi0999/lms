import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionOrThrow } from '../../../lib/auth-utils';
import authzAdmin from '../../../lib/auth0/authzAdmin';

// Return the user's role and permissions
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { user } = await getSessionOrThrow(req, res);

  const [roles, permissions] = await Promise.all([
    authzAdmin.getUserRoles({
      id: user.sub,
    }),
    authzAdmin.getUserPermissions({
      id: user.sub,
    }),
  ]);

  return res.status(200).json({
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.permission_name),
  });
}

export default withApiAuthRequired(handler);
