import { NextApiRequest, NextApiResponse } from 'next';
import { parseMultipartFormData } from '../../../lib/files';
import { attachmentSchema } from '../../../lib/schemas/zod-schemas';
import formidable from 'formidable';
import { saveFileToAzureStorage } from '../../../lib/azure-blob-storage';
import { logger } from '@azure/storage-blob';
import db from '../../../lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

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
  const { fields, files } = await parseMultipartFormData(req);
  const { title, description, type, courseId, topicId } = attachmentSchema.parse(fields);

  const attachment = files.attachment as formidable.File;
  if (!attachment) {
    return res.status(400).json({
      message: 'No attachment provided',
    });
  }

  let attachmentUrl: string;
  try {
    attachmentUrl = await saveFileToAzureStorage({
      access: 'private',
      mimetype: attachment.mimetype || 'image/png',
      path: attachment.filepath,
      name: title,
    });
  } catch (error) {
    logger.error(error, 'Error uploading profile picture');
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }

  const attachmentData: Prisma.AttachmentCreateInput = {
    title,
    description,
    file: attachmentUrl,
  };
  if (type === 'resourceFile') {
    attachmentData['resourceFilesCourse'] = {
      connect: {
        id: courseId,
      },
    };
  } else if (type === 'projectFile') {
    attachmentData['projectFilesCourse'] = {
      connect: {
        id: courseId,
      },
    };
  } else if (type === 'assignmentFile') {
    // TODO: Implement assignment file
  } else if (type === 'topicFile') {
    attachmentData['topic'] = {
      connect: {
        id: topicId,
      },
    };
  }

  const newAttachment = await db.attachment.create({
    data: attachmentData,
  });

  return res.status(201).json(newAttachment);
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
