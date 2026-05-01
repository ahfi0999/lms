import { NextApiRequest, NextApiResponse } from 'next';
import { parseMultipartFormData } from '../../../lib/files';
import formidable from 'formidable';
import { logger } from '@azure/storage-blob';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Extract this to a separate function and use it in all API routes
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
  const { files } = await parseMultipartFormData(req);

  const attachment = files.attachment as formidable.File;
  if (!attachment) {
    return res.status(400).json({
      message: 'No attachment provided',
    });
  }

  const buffer = await readFile(attachment.filepath);
  try {
    const blob = await put(attachment.originalFilename || randomUUID(), buffer, {
      access: 'public',
    });

    logger.info({ blob }, 'File uploaded');
    return res.status(201).json(blob);
  } catch (error) {
    logger.error(error, 'Error uploading the file');
    return res.status(500).json({
      message: 'Something went wrong',
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'utils:upload_files');
