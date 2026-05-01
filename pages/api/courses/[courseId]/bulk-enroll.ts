import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import { bulkEnrollSchema, idSchema } from '../../../../lib/schemas/zod-schemas';
import db from '../../../../lib/db';
import logger from '../../../../lib/logger';
import authzAdmin from '../../../../lib/auth0/authzAdmin';
import { z } from 'zod';
import { BulkEnrollResult } from '../../../../types/courses';
import { getSessionOrThrow } from '../../../../lib/auth-utils';
import { createIssue } from '../../../../lib/linear';
import { Prisma } from '@prisma/client';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { user } = await getSessionOrThrow(req, res);

  const courseId = idSchema.parse(req.query.courseId);
  let emails: string[];
  try {
    emails = bulkEnrollSchema.parse(req.body);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      result: 'error',
      message: 'Invalid request body',
    });
  }

  let course: { users: string[]; contentLink: string | null };
  try {
    course = await db.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },
      select: {
        users: true,
        contentLink: true,
      },
    });
  } catch (error) {
    logger.error(error);
    return res.status(404).json({
      result: 'error',
      message: 'Course not found',
    });
  }

  let result: BulkEnrollResult[] = [];
  for (const email of emails) {
    //  Check if user exists and get user id
    let userId: string;
    try {
      const user = await authzAdmin.getUsersByEmail(email);
      userId = z.string().parse(user[0].user_id);
    } catch (error) {
      logger.error(error);
      result.push({
        email,
        result: 'error',
        message: 'User not found',
      });
      continue;
    }

    //  Check if user is already enrolled
    if (course.users.includes(userId)) {
      result.push({
        email,
        result: 'error',
        message: 'User already enrolled',
      });
      continue;
    }

    //  Add user to course
    try {
      await db.course.update({
        where: {
          id: courseId,
        },
        data: {
          users: {
            push: userId,
          },
        },
      });
    } catch (error) {
      logger.error(error);
      result.push({
        email,
        result: 'error',
        message: 'Failed to add user to course, please try again later',
      });
      continue;
    }

    result.push({
      email,
      result: 'success',
    });
  }

  // Save app event
  let eventData: Prisma.AppEventCreateInput = {
    type: 'COURSE_ACCESS',
    user: {
      connectOrCreate: {
        where: {
          id: user.sub,
        },
        create: {
          id: user.sub,
          email: user.email,
          name: user.name,
        },
      },
    },
    data: {
      action: 'enroll',
      students: result.filter((r) => r.result === 'success').map((r) => r.email),
      courseId,
    },
  };
  try {
    await db.appEvent.create({
      data: eventData,
    });
  } catch (error) {
    logger.error(error);
    createIssue('Failed to create app event', JSON.stringify(eventData, null, 2));
  }

  return res.status(200).json(result);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), ['update:courses']);
