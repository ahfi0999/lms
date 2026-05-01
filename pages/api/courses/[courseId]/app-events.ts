import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import { AppEventType } from '@prisma/client';
import logger from '../../../../lib/logger';
import db from '../../../../lib/db';
import { AppEvent } from '../../../../types/app-events';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const type: AppEvent = req.query.type as AppEvent;
  try {
    if (!Object.values(AppEventType).includes(type)) {
      throw new Error('Invalid type');
    }
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      result: 'error',
      message: 'Invalid data provided',
    });
  }

  let data;
  try {
    data = await db.appEvent.findMany({
      where: {
        type,
        data: {
          path: ['courseId'],
          equals: Number(req.query.courseId),
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      result: 'error',
      message: 'Internal server error',
    });
  }

  return res.status(200).json(data);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'read:app_events');
