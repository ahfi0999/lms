import { NextApiRequest, NextApiResponse } from 'next';
import { parseMultipartFormData } from '../../../lib/files';
import { parse } from 'csv-parse';
import formidable from 'formidable';
import { createReadStream } from 'fs';
import { z } from 'zod';
import logger from '../../../lib/logger';
import { randomUUID } from 'crypto';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import { createIssue } from '../../../lib/linear';
import { sendEmail } from '../../../lib/emails';
import account from '../../../lib/data/account';
import LMSInviteEmail from '../../../emails/lms-invite';
import { render } from '@react-email/render';

// Import CSV file and create users in database
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

  if (!files || !files.csv) {
    return res.status(400).json({
      message: 'No file provided',
    });
  }

  const csvFile = files.csv as formidable.File;
  const csvFileBuffer = createReadStream(csvFile.filepath);
  const parser = csvFileBuffer.pipe(parse({ columns: true }));

  const recordSchema = z.object({
    email: z
      .string()
      .email()
      .transform((value) => value.normalize().toLowerCase()),
    name: z.string().min(1),
    course_ids: z.preprocess((value) => {
      const safeValue = z.string().safeParse(value);
      if (!safeValue.success || !safeValue.data) {
        return [];
      }
      return safeValue.data.split(',').map((course: string) => parseInt(course.trim()));
    }, z.array(z.number())),
  });
  let safeRecords: z.infer<typeof recordSchema>[] = [];
  for await (const record of parser) {
    logger.info({ record });
    const safeRecord = recordSchema.safeParse(record);
    if (!safeRecord.success) {
      return res.status(400).json({
        message: `Invalid record`,
        errors: safeRecord.error,
        data: record,
      });
    }
    safeRecords.push(safeRecord.data);
  }
  for (const user of safeRecords) {
    try {
      // Create user
      const userAuth0Data = await authzAdmin.createUser({
        name: user.name,
        email: user.email,
        connection: 'Username-Password-Authentication',
        password: randomUUID() + 'Capital' + '1!', // For passing Auth0 password policy
        email_verified: true,
      });

      // Assign 'learner' role to user
      await authzAdmin.assignRolestoUser(
        {
          id: z.string().parse(userAuth0Data.user_id),
        },
        {
          roles: [process.env.AUTH0_LEARNER_ROLE_ID],
        }
      );

      // Send email to user with link to set password
      const passwordResetLink = await authzAdmin.createPasswordChangeTicket({
        user_id: userAuth0Data.user_id,
        result_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}`,
      });

      await sendEmail({
        from: `${account.name} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: user.email,
        subject: `Welcome to ${account.name}`,
        html: render(<LMSInviteEmail name={user.name} invitationUrl={passwordResetLink.ticket} />),
      });
    } catch (error) {
      await createIssue(
        'Failed to create user',
        `Failed to create user ${user.name} (${user.email})`
      );
      logger.error({ error });
    }
  }

  return res.status(200).json({
    result: 'success',
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withApiAuthRequired(withApiAuthorizationRequired(handler, 'create:users'));
