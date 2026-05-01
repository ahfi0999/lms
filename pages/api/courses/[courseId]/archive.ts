import { NextApiHandler } from 'next';
import { idSchema } from '../../../../lib/schemas/zod-schemas';
import db from '../../../../lib/db';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

const handler: NextApiHandler = async (req, res) => {
  const courseId = idSchema.parse(req.query.courseId);
  await db.$transaction(async (tx) => {
    const course = await db.course.findUniqueOrThrow({
      where: {
        id: courseId,
      },
      select: {
        archived: true,
      },
    });

    await db.course.update({
      where: {
        id: courseId,
      },
      data: {
        archived: !course.archived,
      },
    });
  });
  return res.status(200).end();
};

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
