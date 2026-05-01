import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import formidable from 'formidable';
import { saveFileToAzureStorage } from '../../lib/azure-blob-storage';
import logger from '../../lib/logger';
import db from '../../lib/db';
import { deleteFileFromAzureStorage } from '../../lib/azure-blob-storage';
import { parseMultipartFormData } from '../../lib/files';
import { idSchema } from '../../lib/schemas/zod-schemas';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getSessionOrThrow } from '../../lib/auth-utils';
import { isAzureBlobUrl, runWithoutErrors } from '../../lib/utils';
import authzAdmin from '../../lib/auth0/authzAdmin';

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { user } = await getSessionOrThrow(req, res);

  const { fields, files } = await parseMultipartFormData(req);

  const { name, email } = profileSchema.parse(fields);

  const profilePicture = files.picture as formidable.File;

  let profilePictureUrl = user.picture;
  if (profilePicture) {
    try {
      // Delete existing profile picture from azure blob storage if it exists
      if (user.picture && isAzureBlobUrl(user.picture)) {
        await runWithoutErrors(async () => await deleteFileFromAzureStorage(user.picture));
      }

      // Upload profile picture to azure blob storage
      profilePictureUrl = await saveFileToAzureStorage({
        access: 'public',
        mimetype: profilePicture.mimetype || 'image/png',
        path: profilePicture.filepath,
        name: user.name,
      });
    } catch (err) {
      logger.error(err);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  // Update user profile
  try {
    const _ = await authzAdmin.updateUser(
      {
        id: user.sub,
      },
      {
        name: name,
        email: email,
        picture: profilePictureUrl,
      }
    );

    return res.status(200).end();
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default withApiAuthRequired(handler);
