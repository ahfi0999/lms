import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export type MailboxFolder = 'INBOX' | 'Sent' | 'Drafts' | '[Gmail]/Trash' | '[Gmail]/Starred' | '[Gmail]/Sent Mail' | '[Gmail]/Drafts';

export type EmailSummary = {
  uid: number;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  date: string;
  preview: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  folder: string;
};

export type EmailDetail = EmailSummary & {
  body: string;
  htmlBody: string | null;
};

function makeClient(account: { email: string; appPassword: string; imapHost: string; imapPort: number }) {
  return new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.email, pass: account.appPassword },
    logger: false,
  });
}

export async function listEmails(
  account: { email: string; appPassword: string; imapHost: string; imapPort: number },
  folder: string,
  page = 1,
  pageSize = 50
): Promise<{ emails: EmailSummary[]; total: number }> {
  const client = makeClient(account);
  await client.connect();

  try {
    const mailbox = await client.mailboxOpen(folder, { readOnly: true });
    const total = mailbox.exists;

    if (total === 0) return { emails: [], total: 0 };

    const end = Math.max(1, total - (page - 1) * pageSize);
    const start = Math.max(1, end - pageSize + 1);

    const emails: EmailSummary[] = [];

    for await (const msg of client.fetch(`${start}:${end}`, {
      uid: true,
      flags: true,
      envelope: true,
    })) {
      const from = msg.envelope?.from?.[0];
      const to = msg.envelope?.to?.[0];
      const preview = '';

      emails.push({
        uid: msg.uid ?? 0,
        subject: msg.envelope?.subject ?? '(no subject)',
        from: from?.name || from?.address || '',
        fromEmail: from?.address || '',
        to: to?.name || to?.address || '',
        toEmail: to?.address || '',
        date: msg.envelope?.date?.toISOString() ?? new Date().toISOString(),
        preview,
        read: msg.flags?.has('\\Seen') ?? false,
        starred: msg.flags?.has('\\Flagged') ?? false,
        hasAttachment: false,
        folder,
      });
    }

    return { emails: emails.reverse(), total };
  } finally {
    await client.logout();
  }
}

export async function getEmail(
  account: { email: string; appPassword: string; imapHost: string; imapPort: number },
  folder: string,
  uid: number
): Promise<EmailDetail | null> {
  const client = makeClient(account);
  await client.connect();

  try {
    await client.mailboxOpen(folder, { readOnly: false });

    const msg = await client.fetchOne(`${uid}`, {
      uid: true,
      flags: true,
      envelope: true,
      source: true,
    }, { uid: true });

    if (!msg) return null;

    await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true });

    const rawBuffer = msg.source ? Buffer.from(msg.source) : Buffer.alloc(0);
    const parsed = await simpleParser(rawBuffer);

    // Replace cid: image references with inline base64 data URIs
    let htmlBody = parsed.html || null;
    if (htmlBody && parsed.attachments) {
      for (const att of parsed.attachments) {
        if (att.contentId && att.content) {
          const cid = att.contentId.replace(/[<>]/g, '');
          const dataUri = `data:${att.contentType};base64,${att.content.toString('base64')}`;
          htmlBody = htmlBody.replace(new RegExp(`cid:${cid}`, 'g'), dataUri);
        }
      }
    }

    const body = parsed.text ?? '';
    const from = msg.envelope?.from?.[0];
    const to = msg.envelope?.to?.[0];
    const hasAttachment = (parsed.attachments ?? []).some((a) => (a as any).disposition === 'attachment');

    return {
      uid: msg.uid ?? 0,
      subject: parsed.subject ?? msg.envelope?.subject ?? '(no subject)',
      from: parsed.from?.value?.[0]?.name || from?.name || from?.address || '',
      fromEmail: parsed.from?.value?.[0]?.address || from?.address || '',
      to: parsed.to && 'value' in parsed.to ? (parsed.to.value?.[0]?.name || parsed.to.value?.[0]?.address || '') : (to?.name || to?.address || ''),
      toEmail: parsed.to && 'value' in parsed.to ? (parsed.to.value?.[0]?.address || '') : (to?.address || ''),
      date: (parsed.date ?? msg.envelope?.date ?? new Date()).toISOString(),
      preview: body.slice(0, 120),
      read: true,
      starred: msg.flags?.has('\\Flagged') ?? false,
      hasAttachment,
      folder,
      body,
      htmlBody,
    };
  } finally {
    await client.logout();
  }
}

export async function setFlags(
  account: { email: string; appPassword: string; imapHost: string; imapPort: number },
  folder: string,
  uid: number,
  flags: { read?: boolean; starred?: boolean }
) {
  const client = makeClient(account);
  await client.connect();

  try {
    await client.mailboxOpen(folder, { readOnly: false });

    if (flags.read === true)  await client.messageFlagsAdd(`${uid}`,    ['\\Seen'],    { uid: true });
    if (flags.read === false) await client.messageFlagsRemove(`${uid}`, ['\\Seen'],    { uid: true });
    if (flags.starred === true)  await client.messageFlagsAdd(`${uid}`, ['\\Flagged'], { uid: true });
    if (flags.starred === false) await client.messageFlagsRemove(`${uid}`, ['\\Flagged'], { uid: true });
  } finally {
    await client.logout();
  }
}

export async function moveToTrash(
  account: { email: string; appPassword: string; imapHost: string; imapPort: number },
  folder: string,
  uid: number
) {
  const client = makeClient(account);
  await client.connect();

  try {
    await client.mailboxOpen(folder, { readOnly: false });
    await client.messageMove(`${uid}`, '[Gmail]/Trash', { uid: true });
  } finally {
    await client.logout();
  }
}
