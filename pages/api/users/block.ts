import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '../../../lib/logger';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const schema = z.object({
    userId: z.string(),
    blocked: z.boolean(),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid data', errors: parsed.error });
  }

  const { userId, blocked } = parsed.data;

  try {
    // Update the user's blocked status in Auth0
    await authzAdmin.updateUser({ id: userId }, { blocked });

    return res.status(200).json({ result: 'success', blocked });
  } catch (error: any) {
    logger.error({ msg: 'Failed to update user block status', error });

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

// We can require admin:dashboards or create:users depending on your permissions structure.
export default withApiAuthRequired(withApiAuthorizationRequired(handler, 'admin:dashboards'));
