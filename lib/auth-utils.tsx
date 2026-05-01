import { getAccessToken, getSession } from '@auth0/nextjs-auth0';
import { logger } from '@azure/storage-blob';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { Permission } from '../types/auth0';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import authzAdmin from './auth0/authzAdmin';

/**
 *
 * Returns the session object if the user is logged in, otherwise throws an error.
 */
export const getSessionOrThrow = async (
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
) => {
  let session;
  try {
    session = await getSession(req, res);
    if (!session) {
      throw new Error('No session found');
    }
  } catch (error) {
    logger.error(error);
    throw new Error('No session found');
  }

  return session;
};

/**
 * Deocde the JWT token and return payload
 * @param token
 * @returns payload
 */
export const getTokenPayload = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  const payload = JSON.parse(Buffer.from(base64, 'base64').toString('binary'));
  return payload;
};

export const checkAuthorizationForPage = async (
  context: GetServerSidePropsContext,
  permissions: Permission | ReadonlyArray<Permission>
) => {
  const accessTokenData = await getAccessToken(context.req, context.res);
  if (!accessTokenData.accessToken) {
    throw new Error('No access token found');
  }
  const payload = getTokenPayload(accessTokenData.accessToken);

  const requiredPermissions: Permission[] = Array.isArray(permissions)
    ? permissions
    : [permissions];

  const userHasRequiredPermissions = requiredPermissions.every((permission) =>
    payload.permissions.includes(permission)
  );

  if (!userHasRequiredPermissions) {
    throw new Error('Insufficient permissions');
  }

  return userHasRequiredPermissions;
};

export function verifyAuthzToken(token: string) {
  const client = jwksClient({
    jwksUri: `${process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`,
  });

  function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    client.getSigningKey(header.kid, function (err, key) {
      if (err || !key) {
        callback(err);
        return;
      }

      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: `${process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL}/`,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        }
        resolve(decoded);
      }
    );
  });
}

export async function getUserInfo(userId: string) {
  let user;
  try {
    user = await authzAdmin.getUser({ id: userId });
  } catch (error) {
    logger.error(error);
    throw new Error('No user found');
  }

  return user;
}
