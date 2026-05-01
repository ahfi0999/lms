import { getSession } from '@auth0/nextjs-auth0';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getTokenPayload, verifyAuthzToken } from './auth-utils';
import { Permission } from '../types/auth0';

function withApiAuthorizationRequired(
  handler: NextApiHandler,
  permissions: Permission | Permission[]
) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);
    let accessToken = session?.accessToken;

    if (!accessToken) {
      // Try to get the access token from the authorization header
      const authorization = req.headers.authorization;
      if (authorization?.toLowerCase().startsWith('bearer ')) {
        accessToken = authorization.split(' ')[1];
      }

      // Verify the access token
      if (accessToken) {
        try {
          await verifyAuthzToken(accessToken);
        } catch (error) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
      }
    }

    if (!accessToken) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const payload = await getTokenPayload(accessToken);
    const userPermissions = payload.permissions || [];

    const hasRequiredPermissions = requiredPermissions.every((requiredPermission) => {
      return userPermissions.includes(requiredPermission);
    });

    if (!hasRequiredPermissions) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    return handler(req, res);
  };
}

export default withApiAuthorizationRequired;
