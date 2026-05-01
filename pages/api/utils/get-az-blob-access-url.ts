import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getAzureBlobAccessUrl } from '../../../lib/azure-blob-storage';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const azureFileUrl = z.string().url().parse(req.query.azureFileUrl);

  let url = null;
  try {
    url = await getAzureBlobAccessUrl(azureFileUrl);
  } catch (error) {
    return res.status(404).json({
      message: 'File not found.',
    });
  }

  return res.send(url);
}

export default withApiAuthRequired(handler);
