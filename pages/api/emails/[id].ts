import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import db from '../../../lib/db';
import { getEmail, setFlags, moveToTrash } from '../../../lib/imap-client';

const FOLDER_MAP: Record<string, string> = {
  inbox:   'INBOX',
  sent:    '[Gmail]/Sent Mail',
  drafts:  '[Gmail]/Drafts',
  trash:   '[Gmail]/Trash',
  starred: '[Gmail]/Starred',
};

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const uid = Number(req.query.id);
  const accountId = Number(req.query.accountId);
  const folder = String(req.query.folder ?? 'inbox');
  const imapFolder = FOLDER_MAP[folder] ?? 'INBOX';

  if (isNaN(uid)) return res.status(400).json({ message: 'Invalid uid' });

  const account = await db.emailAccount.findFirst({
    where: accountId ? { id: accountId } : { isDefault: true },
  });
  if (!account) return res.status(404).json({ message: 'No email account configured' });

  // GET — fetch full email
  if (req.method === 'GET') {
    try {
      const email = await getEmail(account, imapFolder, uid);
      if (!email) return res.status(404).json({ message: 'Email not found' });
      return res.status(200).json(email);
    } catch (err: any) {
      return res.status(500).json({ message: err.message ?? 'IMAP error' });
    }
  }

  // PATCH — update flags (read / starred)
  if (req.method === 'PATCH') {
    try {
      const { read, starred } = req.body;
      await setFlags(account, imapFolder, uid, { read, starred });
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ message: err.message ?? 'IMAP error' });
    }
  }

  // DELETE — move to trash
  if (req.method === 'DELETE') {
    try {
      await moveToTrash(account, imapFolder, uid);
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ message: err.message ?? 'IMAP error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
});
