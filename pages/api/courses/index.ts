import { NextApiRequest, NextApiResponse } from 'next';
import { parseMultipartFormData } from '../../../lib/files';
import { courseDetailsSchema } from '../../../lib/schemas/zod-schemas';
import formidable from 'formidable';
import { saveFileToAzureStorage } from '../../../lib/azure-blob-storage';
import { logger } from '@azure/storage-blob';
import db from '../../../lib/db';
import { z } from 'zod';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import { getSessionOrThrow } from '../../../lib/auth-utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['POST'].includes(z.string().parse(req.method))) {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  if (req.method === 'POST') {
    return POST(req, res);
  }
}

async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { user } = await getSessionOrThrow(req, res);
  const { fields, files } = await parseMultipartFormData(req);
  const { title, description, liveLink, contentLink } = courseDetailsSchema.parse(fields);

  const picture = files.picture as formidable.File;
  if (!picture) {
    return res.status(400).json({
      message: 'No picture provided',
    });
  }

  let pictureUrl: string;
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

  const course = await db.course.create({
    data: {
      title,
      description,
      liveLink,
      picture: pictureUrl,
      contentLink,
      users: {
        set: [user.sub],
      },
    },
  });

  return res.status(201).json(course);
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default withApiAuthRequired(withApiAuthorizationRequired(handler, 'create:courses'));
