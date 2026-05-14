import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import db from '../../../lib/db';
import { listEmails } from '../../../lib/imap-client';

const FOLDER_MAP: Record<string, string> = {
  inbox:   'INBOX',
  sent:    '[Gmail]/Sent Mail',
  drafts:  '[Gmail]/Drafts',
  trash:   '[Gmail]/Trash',
  starred: '[Gmail]/Starred',
};

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const accountId = Number(req.query.accountId);
  const folder = String(req.query.folder ?? 'inbox');
  const page = Number(req.query.page ?? 1);

  const account = await db.emailAccount.findFirst({
    where: accountId ? { id: accountId } : { isDefault: true },
  });

  if (!account) return res.status(404).json({ message: 'No email account configured' });

  try {
    const imapFolder = FOLDER_MAP[folder] ?? 'INBOX';
    const result = await listEmails(account, imapFolder, page, 50);
    return res.status(200).json({ ...result, accountId: account.id, folder });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? 'IMAP error' });
  }
});
