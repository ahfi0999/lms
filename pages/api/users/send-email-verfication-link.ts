import { NextApiRequest, NextApiResponse } from 'next';
import logger from '../../../lib/logger';
import { getSession, withApiAuthRequired, updateSession } from '@auth0/nextjs-auth0';
import authzAdmin from '../../../lib/auth0/authzAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  // Get the user's session and email address
  let session;
  try {
    session = await getSession(req, res);
    if (!session?.user.email) {
      throw new Error('No email address found');
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }

  if (session.user.email_verified) {
    return res.status(400).json({
      message: 'Email already verified',
    });
  }

  try {
    await authzAdmin.sendEmailVerification({
      user_id: session.user.sub,
    });
    logger.info(`Email verification link sent to ${session.user.email}`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }

  return res.status(200).json({
    message: 'Email verification link sent',
  });
}

export default withApiAuthRequired(handler);
