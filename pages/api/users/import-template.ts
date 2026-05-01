import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import withApiAuthorizationRequired from '../../../lib/withApiAuthorizationRequired';

// Import CSV file and create users in database
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: 'Method not allowed',
    });
  }

  const csv = `name,email
John Doe,johndoe@example.com
`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=import_users_template.csv');
  res.status(200).send(csv);
}

export default withApiAuthorizationRequired(withApiAuthRequired(handler), 'read:users');
