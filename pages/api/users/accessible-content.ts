import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthzToken } from '../../../lib/auth-utils';
import logger from '../../../lib/logger';
import { z } from 'zod';
import db from '../../../lib/db';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.error('No token provided');
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  // Verify token
  let payload;
  let userId;
  try {
    payload = await verifyAuthzToken(token);
    userId = z.object({ sub: z.string() }).parse(payload).sub;
  } catch (error) {
    logger.error(error);
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  // Return accessible content
  let content;
  try {
    const courses = await db.course.findMany({
      where: {
        users: {
          has: userId,
        },
      },
      select: {
        contentLink: true,
      },
    });
    content = courses.map((course) => course.contentLink).filter(Boolean);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }

  res.status(200).json(content);
}

// No need `withApiAuthRequired` here because this api is called from the client side and the token is passed in the request header instead of the cookie (session)
// Token is verified using `verifyAuthzToken` function
export default withApiAuthorizationRequired(handler, 'read:mycourses');
