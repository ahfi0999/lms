import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const courses = await db.course.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  return res.status(200).json(courses);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'read:courses');
