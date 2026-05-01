import { NextApiRequest, NextApiResponse } from 'next';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getSessionOrThrow } from '../../../lib/auth-utils';
import logger from '../../../lib/logger';

/**
 * Send password reset email
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { user } = await getSessionOrThrow(req, res);

  try {
    await authzAdmin.createPasswordChangeTicket({
      email: user.email,
      connection_id: process.env.AUTH0_DB_CONNECTION_ID,
    });
    // TODO: What about existing sessions?
    logger.info(`Password reset email sent to ${user.email}`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }

  return res.status(200).json({
    message: 'Password reset email sent',
  });
}

export default withApiAuthRequired(handler);
