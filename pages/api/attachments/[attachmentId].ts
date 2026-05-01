import { NextApiRequest, NextApiResponse } from 'next';
import { idSchema } from '../../../lib/schemas/zod-schemas';
import { deleteFileFromAzureStorage } from '../../../lib/azure-blob-storage';
import { logger } from '@azure/storage-blob';
import db from '../../../lib/db';
import { z } from 'zod';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['DELETE'].includes(z.string().parse(req.method))) {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const attachmentId = idSchema.parse(req.query.attachmentId);
  if (req.method === 'DELETE') {
    return DELETE(req, res, attachmentId);
  }
}

async function DELETE(req: NextApiRequest, res: NextApiResponse, attachmentId: number) {
  const attachment = await db.attachment.delete({
    where: {
      id: attachmentId,
    },
    select: {
      file: true,
    },
  });

  // Delete the file from azure blob storage
  let retries = 0;
  while (retries < 3) {
    try {
      await deleteFileFromAzureStorage(attachment.file);
      break;
    } catch (error) {
      logger.error(error);
      retries++;
    } finally {
      if (retries === 3) {
        logger.error(`Failed to delete file ${attachment.file} from azure blob storage`);
      }
    }
  }

  return res.json({
    message: 'Attachment deleted',
  });
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'update:courses');
