import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { z } from 'zod';
import {
  deleteFileFromAzureStorage,
  saveFileToAzureStorage,
} from '../../../../lib/azure-blob-storage';
import db from '../../../../lib/db';
import { parseMultipartFormData } from '../../../../lib/files';
import {
  idSchema,
  courseDetailsSchema,
  coursePatchSchema,
} from '../../../../lib/schemas/zod-schemas';
import logger from '../../../../lib/logger';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../../lib/withApiAuthorizationRequired';
import { runWithoutErrors } from '../../../../lib/utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['PUT', 'DELETE', 'PATCH'].includes(z.string().parse(req.method))) {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const courseId = idSchema.parse(req.query.courseId);

  if (req.method === 'PUT') {
    return PUT(req, res, courseId);
  }

  if (req.method === 'DELETE') {
    return DELETE(req, res, courseId);
  }
}

async function PUT(req: NextApiRequest, res: NextApiResponse, courseId: number) {
  const currentCourseData = await db.course.findUniqueOrThrow({
    where: {
      id: courseId,
    },
    select: {
      picture: true,
      contentLink: true,
    },
  });

  const { fields, files } = await parseMultipartFormData(req);
  const { title, description, liveLink, contentLink } = courseDetailsSchema.parse(fields);

  const picture = files.picture as formidable.File;
  let pictureUrl = null;
  if (picture) {
    // Some blob files are not present currently used storage container
    await runWithoutErrors(async () => await deleteFileFromAzureStorage(currentCourseData.picture));

    // Upload new picture
    try {
      pictureUrl = await saveFileToAzureStorage({
        access: 'public',
        mimetype: picture.mimetype || 'image/png',
        path: picture.filepath,
        name: title,
      });
    } catch (error) {
      logger.error(error, 'Error uploading profile picture');
      return res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }

  const updatedCourse = await db.course.update({
    where: {
      id: courseId,
    },
    data: {
      title,
      description,
      liveLink,
      picture: pictureUrl || currentCourseData.picture,
      contentLink,
    },
  });

  return res.status(200).json(updatedCourse);
}

async function DELETE(req: NextApiRequest, res: NextApiResponse, courseId: number) {
  await db.course.update({
    where: {
      id: courseId,
    },
    data: {
      archived: true,
    },
  });

  return res.status(200).json({
    message: 'Course archived',
  });
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
