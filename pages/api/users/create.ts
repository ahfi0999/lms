import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '../../../lib/logger';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import db from '../../../lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    roleId: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid data', errors: parsed.error });
  }

  const { email, password, name, roleId } = parsed.data;

  try {
    // 1. Create in Auth0 (Auth0 Database connections often only require email and password)
    const auth0User = await authzAdmin.createUser({
      email,
      password,
      connection: 'Username-Password-Authentication',
      email_verified: true,
      name: name, // Name is allowed, but if it causes issues we can keep it as is, Auth0 usually accepts it.
    });

    const userId = z.string().parse(auth0User.user_id);

    // 2. Assign Role
    if (roleId) {
      await authzAdmin.assignRolestoUser({ id: userId }, { roles: [roleId] });
    }

    // 3. Sync to local Prisma DB
    await db.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: email,
        name: name, // We save the name to our own database
      },
      update: {},
    });

    return res.status(200).json({ result: 'success' });
  } catch (error: any) {
    logger.error({ msg: 'Failed to create user', error });

    // Auth0 often throws errors with detailed messages (e.g. password policy)
    const errorMessage =
      error?.message ||
      error?.response?.body?.message ||
      error?.response?.data?.message ||
      'Unknown error occurred while communicating with Auth0.';

    return res.status(500).json({
      message: errorMessage,
      error: errorMessage,
    });
  }
}

export default withApiAuthRequired(withApiAuthorizationRequired(handler, 'create:users'));
