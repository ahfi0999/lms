import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import { idSchema, addModuleSchema } from '../../../lib/schemas/zod-schemas';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const { title, courseId } = addModuleSchema
    .extend({
      courseId: idSchema,
    })
    .parse(req.body);

  await db.$transaction(async (tx) => {
    const module = await db.module.create({
      data: {
        title,
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });

    // Update module order array
    await tx.course.update({
      where: {
        id: courseId,
      },
      data: {
        modulesOrder: {
          push: module.id,
        },
      },
    });
  });

  return res.status(201).json(module);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
