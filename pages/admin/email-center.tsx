import { useState, useMemo } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  CloseButton,
  Divider,
  Group,
  Loader,
  Center,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  Badge,
  rem,
  createStyles,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBrandGoogle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconInbox,
  IconInfoCircle,
  IconLock,
  IconMail,
  IconMailOpened,
  IconPaperclip,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconSend,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconX,
  IconWriting,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { checkAuthorizationForPage } from '../../lib/auth-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type Folder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred';

type EmailAccount = { id: number; label: string; email: string; isDefault: boolean };

type EmailSummary = {
  uid: number; subject: string; from: string; fromEmail: string;
  to: string; toEmail: string; date: string; preview: string;
  read: boolean; starred: boolean; hasAttachment: boolean; folder: string;
};

type EmailDetail = EmailSummary & { body: string; htmlBody: string | null };

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    backgroundColor: '#f0f2f5',
    overflow: 'hidden',
    gap: rem(8),
    padding: rem(8),
  },

  // Left sidebar
  sidebar: {
    width: rem(200),
    minWidth: rem(200),
    backgroundColor: 'white',
    borderRadius: rem(16),
    display: 'flex',
    flexDirection: 'column',
    padding: `${rem(16)} ${rem(8)}`,
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  },
  composeBtn: {
    margin: `${rem(4)} ${rem(8)} ${rem(16)}`,
    borderRadius: rem(12),
    height: rem(44),
    fontWeight: 600,
    fontSize: 14,
  },
  folderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(10),
    padding: `${rem(9)} ${rem(12)}`,
    borderRadius: rem(10),
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: theme.colors.gray[7],
    userSelect: 'none' as const,
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },
  folderBtnActive: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[7],
    fontWeight: 600,
    '&:hover': { backgroundColor: theme.colors.blue[0] },
  },

  // Middle pane
  listPane: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: rem(8),
    overflow: 'hidden',
  },
  listHeader: {
    backgroundColor: 'white',
    borderRadius: rem(16),
    padding: `${rem(12)} ${rem(16)}`,
    display: 'flex',
    alignItems: 'center',
    gap: rem(10),
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: rem(10),
    height: rem(38),
    padding: `0 ${rem(14)}`,
    display: 'flex',
    alignItems: 'center',
    gap: rem(8),
  },

  // Email card
  emailCard: {
    backgroundColor: 'white',
    borderRadius: rem(14),
    padding: `${rem(14)} ${rem(16)}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: rem(12),
    boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    border: '1.5px solid transparent',
    transition: 'all 120ms ease',
    flexShrink: 0,
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,.08)',
      borderColor: theme.colors.blue[2],
    },
  },
  emailCardUnread: {
    borderLeft: `3px solid ${theme.colors.blue[5]}`,
  },
  emailCardSelected: {
    borderColor: `${theme.colors.blue[4]} !important`,
    backgroundColor: theme.colors.blue[0],
    boxShadow: `0 0 0 2px ${theme.colors.blue[2]} !important`,
  },

  // Right detail pane
  detailPane: {
    width: '42%',
    minWidth: rem(400),
    backgroundColor: 'white',
    borderRadius: rem(16),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  },
  detailHeader: {
    padding: `${rem(16)} ${rem(20)}`,
    borderBottom: `1px solid ${theme.colors.gray[1]}`,
    flexShrink: 0,
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: `${rem(16)} ${rem(20)}`,
  },

  // Compose window
  composeWindow: {
    position: 'fixed' as const,
    bottom: 0,
    right: rem(24),
    width: rem(700),
    backgroundColor: 'white',
    borderRadius: `${rem(12)} ${rem(12)} 0 0`,
    boxShadow: '0 -4px 24px rgba(0,0,0,.14)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  composeHeader: {
    background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
    color: 'white',
    padding: `${rem(12)} ${rem(16)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none' as const,
    flexShrink: 0,
  },
  composeField: {
    borderBottom: `1px solid #f0f2f5`,
    padding: `${rem(6)} ${rem(16)}`,
    display: 'flex',
    alignItems: 'center',
    gap: rem(8),
    flexShrink: 0,
  },
  composeFooter: {
    padding: `${rem(10)} ${rem(16)}`,
    display: 'flex',
    alignItems: 'center',
    gap: rem(8),
    borderTop: `1px solid #f0f2f5`,
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diff = (now.getTime() - date.getTime()) / 86400000;
  if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
function avatarColor(name: string) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length]; }

// ─── Connect Screen ───────────────────────────────────────────────────────────

function ConnectScreen({ onConnected }: { onConnected: () => void }) {
  const [label, setLabel] = useState('Support');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function connect() {
    if (!label || !email || !password) { notify({ type: 'error', message: 'Please fill in all fields.' }); return; }
    setLoading(true);
    try {
      await http.post('/api/email-accounts', { label, email, appPassword: password, isDefault: true });
      notify({ type: 'success', message: 'Mailbox connected!' });
      onConnected();
    } catch { notify({ type: 'error', message: 'Failed to connect. Check your App Password.' }); }
    finally { setLoading(false); }
  }

  return (
    <Center sx={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <Box sx={{ backgroundColor: 'white', borderRadius: 16, padding: '48px 40px', width: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <ThemeIcon size={56} radius="xl" color="blue" variant="light" mx="auto" mb="md">
          <IconBrandGoogle size={28} />
        </ThemeIcon>
        <Text size="xl" weight={700} mb={4}>Connect your Gmail</Text>
        <Text size="sm" color="dimmed" mb="xl">Connect a Google Workspace mailbox to manage emails from the admin panel.</Text>
        <Stack spacing="sm">
          <TextInput label="Label" placeholder="Support" value={label} onChange={(e) => setLabel(e.currentTarget.value)} />
          <TextInput label="Email" placeholder="support@yourcompany.com" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="App Password" description="Generate at myaccount.google.com/security → App Passwords" placeholder="xxxx xxxx xxxx xxxx" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" mt={4}>
            <Text size="xs">Enable IMAP in Gmail: Settings → Forwarding and POP/IMAP → Enable IMAP</Text>
          </Alert>
          <Button fullWidth mt="sm" size="md" leftIcon={<IconLock size={16} />} loading={loading} onClick={connect}>Connect mailbox</Button>
        </Stack>
      </Box>
    </Center>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmailCenterPage() {
  const { classes, cx } = useStyles();
  const qc = useQueryClient();

  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts'],
    queryFn: () => http.get('/api/email-accounts').then((r) => r.data),
  });

  const currentAccountId = activeAccountId ?? accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id;

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery<{ emails: EmailSummary[]; total: number }>({
    queryKey: ['emails', currentAccountId, activeFolder, page],
    queryFn: () => http.get('/api/emails/list', { params: { accountId: currentAccountId, folder: activeFolder, page } }).then((r) => r.data),
    enabled: !!currentAccountId,
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const emails = listData?.emails ?? [];
  const total = listData?.total ?? 0;

  const { data: selectedEmail, isLoading: detailLoading } = useQuery<EmailDetail>({
    queryKey: ['email-detail', currentAccountId, activeFolder, selectedUid],
    queryFn: () => http.get(`/api/emails/${selectedUid}`, { params: { accountId: currentAccountId, folder: activeFolder } }).then((r) => r.data),
    enabled: !!selectedUid && !!currentAccountId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const flagMutation = useMutation({
    mutationFn: ({ uid, flags }: { uid: number; flags: object }) =>
      http.patch(`/api/emails/${uid}`, { ...flags, accountId: currentAccountId, folder: activeFolder }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emails', currentAccountId, activeFolder] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: number) => http.delete(`/api/emails/${uid}`, { params: { accountId: currentAccountId, folder: activeFolder } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emails', currentAccountId, activeFolder] });
      setSelectedUid(null);
      notify({ type: 'success', message: 'Moved to Trash' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: object) => http.post('/api/emails/send', data),
    onSuccess: () => {
      notify({ type: 'success', message: 'Email sent' });
      setComposeOpen(false); setComposeTo(''); setComposeSubject(''); setComposeBody('');
      setReplyOpen(false); setReplyBody('');
    },
    onError: (err: any) => notify({ type: 'error', message: err?.response?.data?.message ?? 'Failed to send email' }),
  });

  const visibleEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();
    return emails.filter((e) => e.from.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q));
  }, [emails, searchQuery]);

  const unreadCount = emails.filter((e) => !e.read).length;

  function selectEmail(uid: number) {
    setSelectedUid(uid); setReplyOpen(false); setReplyBody('');
    qc.setQueryData(['emails', currentAccountId, activeFolder, page], (old: any) =>
      old ? { ...old, emails: old.emails.map((e: EmailSummary) => e.uid === uid ? { ...e, read: true } : e) } : old
    );
  }

  function toggleStar(uid: number, starred: boolean, ev: React.MouseEvent) {
    ev.stopPropagation();
    qc.setQueryData(['emails', currentAccountId, activeFolder, page], (old: any) =>
      old ? { ...old, emails: old.emails.map((e: EmailSummary) => e.uid === uid ? { ...e, starred: !starred } : e) } : old
    );
    flagMutation.mutate({ uid, flags: { starred: !starred } });
  }

  function handleSend() {
    if (!composeTo || !composeSubject || !composeBody) { notify({ type: 'error', message: 'Please fill in all fields' }); return; }
    sendMutation.mutate({ to: composeTo, subject: composeSubject, body: composeBody, accountId: currentAccountId });
  }

  function handleReply() {
    if (!replyBody.trim() || !selectedEmail) return;
    sendMutation.mutate({ to: selectedEmail.fromEmail, subject: `Re: ${selectedEmail.subject}`, body: replyBody, accountId: currentAccountId });
  }

  const folders: { id: Folder; label: string; icon: React.FC<any> }[] = [
    { id: 'inbox',   label: 'Inbox',   icon: IconInbox     },
    { id: 'starred', label: 'Starred', icon: IconStarFilled },
    { id: 'sent',    label: 'Sent',    icon: IconSend      },
    { id: 'drafts',  label: 'Drafts',  icon: IconEdit      },
    { id: 'trash',   label: 'Trash',   icon: IconTrash     },
  ];

  if (accountsLoading) return <AdminLayout noPadding><Center sx={{ flex: 1 }}><Loader size="sm" /></Center></AdminLayout>;
  if (accounts.length === 0) return <AdminLayout noPadding><Box sx={{ display: 'flex', height: '100%' }}><ConnectScreen onConnected={() => refetchAccounts()} /></Box></AdminLayout>;

  return (
    <AdminLayout noPadding>
      <Box className={classes.root}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <Box className={classes.sidebar}>
          <Button
            className={classes.composeBtn}
            leftIcon={<IconWriting size={16} />}
            onClick={() => { setComposeOpen(true); setComposeMinimized(false); }}
            variant="gradient"
            gradient={{ from: '#1a73e8', to: '#1557b0' }}
            fullWidth
          >
            Compose
          </Button>

          {accounts.length > 1 && (
            <Box px={8} mb={8}>
              <Select size="xs" value={String(currentAccountId)} onChange={(v) => { setActiveAccountId(Number(v)); setSelectedUid(null); setPage(1); }}
                data={accounts.map((a) => ({ value: String(a.id), label: a.label }))}
                styles={{ input: { borderRadius: 8 } }}
              />
            </Box>
          )}
          {accounts.length === 1 && (
            <Box px={12} mb={8}>
              <Text size="xs" color="dimmed" truncate weight={500}>{accounts[0].email}</Text>
            </Box>
          )}

          <Stack spacing={2} px={4}>
            {folders.map((f) => (
              <Box key={f.id} className={cx(classes.folderBtn, { [classes.folderBtnActive]: activeFolder === f.id })}
                onClick={() => { setActiveFolder(f.id); setSelectedUid(null); setPage(1); setSearchQuery(''); }}
              >
                <f.icon size={17} stroke={1.8} />
                <Text size="sm" sx={{ flex: 1 }}>{f.label}</Text>
                {f.id === 'inbox' && unreadCount > 0 && (
                  <Badge size="xs" color="blue" variant="filled" radius="xl">{unreadCount}</Badge>
                )}
              </Box>
            ))}
          </Stack>
        </Box>

        {/* ── Email List ───────────────────────────────────────── */}
        <Box className={classes.listPane}>
          {/* Search header */}
          <Box className={classes.listHeader}>
            <Box className={classes.searchInput}>
              <IconSearch size={16} color="#9ca3af" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search emails..."
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: '#111827' }}
              />
              {searchQuery && <ActionIcon size="xs" variant="transparent" onClick={() => setSearchQuery('')}><IconX size={12} color="#9ca3af" /></ActionIcon>}
            </Box>
            <Tooltip label="Refresh">
              <ActionIcon variant="light" color="blue" radius="md" onClick={() => refetchList()}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Box>

          {/* Folder title */}
          <Group px={4} spacing={8}>
            <Text weight={700} size="sm" color="dark" sx={{ textTransform: 'capitalize' }}>{activeFolder}</Text>
            {total > 0 && <Badge size="sm" color="gray" variant="light" radius="xl">{total}</Badge>}
          </Group>

          {/* Cards */}
          <ScrollArea sx={{ flex: 1 }} type="hover" offsetScrollbars>
            <Stack spacing={6} pb={8}>
              {listLoading ? (
                <Center py="xl"><Loader size="sm" /></Center>
              ) : visibleEmails.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" spacing="xs">
                    <ThemeIcon size={56} radius="xl" color="gray" variant="light"><IconMailOpened size={28} /></ThemeIcon>
                    <Text color="dimmed" weight={500}>No emails here</Text>
                  </Stack>
                </Center>
              ) : visibleEmails.map((email) => (
                <Box
                  key={email.uid}
                  className={cx(classes.emailCard, { [classes.emailCardUnread]: !email.read, [classes.emailCardSelected]: selectedUid === email.uid })}
                  onClick={() => selectEmail(email.uid)}
                >
                  <Avatar size={40} radius="xl" sx={{ backgroundColor: avatarColor(email.from), flexShrink: 0 }}>
                    <Text size="xs" weight={700} color="white">{getInitials(email.from || email.fromEmail)}</Text>
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Group position="apart" mb={2} noWrap>
                      <Text size="sm" weight={email.read ? 500 : 700} truncate sx={{ color: '#111827' }}>
                        {email.from || email.fromEmail}
                      </Text>
                      <Text size="xs" color="dimmed" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {formatDate(email.date)}
                      </Text>
                    </Group>
                    <Group position="apart" noWrap>
                      <Text size="sm" weight={email.read ? 400 : 600} truncate sx={{ color: email.read ? '#6b7280' : '#111827' }}>
                        {email.subject}
                      </Text>
                      <Group spacing={4} sx={{ flexShrink: 0 }}>
                        {email.hasAttachment && <IconPaperclip size={13} color="#9ca3af" />}
                        <ActionIcon size="xs" variant="transparent" onClick={(e: React.MouseEvent) => toggleStar(email.uid, email.starred, e)}
                          sx={{ color: email.starred ? '#f59e0b' : '#d1d5db', '&:hover': { color: '#f59e0b' } }}
                        >
                          {email.starred ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                        </ActionIcon>
                      </Group>
                    </Group>
                    {!email.read && (
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: 4 }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </ScrollArea>

          {/* Pagination */}
          {total > 50 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, backgroundColor: 'white', borderRadius: rem(12), padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <Text size="xs" color="dimmed">{(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</Text>
              <ActionIcon size="sm" variant="subtle" color="blue" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><IconChevronLeft size={16} /></ActionIcon>
              <ActionIcon size="sm" variant="subtle" color="blue" disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)}><IconChevronRight size={16} /></ActionIcon>
            </Box>
          )}
        </Box>

        {/* ── Detail Pane ──────────────────────────────────────── */}
        {selectedUid && (
          <Box className={classes.detailPane}>
            <Box className={classes.detailHeader}>
              <Group position="apart" mb={selectedEmail ? 'sm' : 0}>
                <Group spacing={6}>
                  <Tooltip label="Back">
                    <ActionIcon variant="subtle" color="gray" radius="md" onClick={() => setSelectedUid(null)}>
                      <IconChevronLeft size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon variant="subtle" color="red" radius="md" onClick={() => selectedUid && deleteMutation.mutate(selectedUid)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Mark unread">
                    <ActionIcon variant="subtle" color="blue" radius="md" onClick={() => selectedUid && flagMutation.mutate({ uid: selectedUid, flags: { read: false } })}>
                      <IconMailOpened size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                {selectedEmail && <Text size="xs" color="dimmed">{formatDate(selectedEmail.date)}</Text>}
              </Group>
              {selectedEmail && (
                <Text size="md" weight={700} sx={{ color: '#111827' }} lineClamp={2}>{selectedEmail.subject}</Text>
              )}
            </Box>

            {detailLoading || !selectedEmail ? (
              <Center sx={{ flex: 1 }}><Loader size="sm" /></Center>
            ) : (
              <ScrollArea className={classes.detailBody} type="hover">
                <Group mb="lg" align="flex-start" noWrap>
                  <Avatar size={42} radius="xl" sx={{ backgroundColor: avatarColor(selectedEmail.from), flexShrink: 0 }}>
                    <Text size="sm" weight={700} color="white">{getInitials(selectedEmail.from || selectedEmail.fromEmail)}</Text>
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Group spacing={6} mb={2}>
                      <Text size="sm" weight={700}>{selectedEmail.from}</Text>
                      <ActionIcon size="xs" variant="transparent" sx={{ color: selectedEmail.starred ? '#f59e0b' : '#d1d5db' }}
                        onClick={(e: React.MouseEvent) => toggleStar(selectedEmail.uid, selectedEmail.starred, e)}>
                        {selectedEmail.starred ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                      </ActionIcon>
                    </Group>
                    <Text size="xs" color="dimmed">{selectedEmail.fromEmail}</Text>
                    <Text size="xs" color="dimmed">to {selectedEmail.to || selectedEmail.toEmail}</Text>
                  </Box>
                </Group>

                <Divider mb="md" />

                {selectedEmail.htmlBody ? (
                  <Box sx={{ fontSize: 14, lineHeight: 1.8, overflow: 'hidden' }}>
                    <iframe
                      srcDoc={selectedEmail.htmlBody}
                      sandbox="allow-same-origin allow-popups"
                      style={{ width: '100%', border: 'none', minHeight: 300 }}
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        const h = iframe.contentDocument?.documentElement?.scrollHeight;
                        if (h) iframe.style.height = h + 'px';
                      }}
                    />
                  </Box>
                ) : (
                  <Text size="sm" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#374151' }}>
                    {selectedEmail.body}
                  </Text>
                )}

                <Box mt="xl">
                  {replyOpen ? (
                    <Box sx={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                      <Box sx={{ padding: '8px 14px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <Text size="xs" color="dimmed">Reply to <strong>{selectedEmail.from}</strong></Text>
                      </Box>
                      <Textarea value={replyBody} onChange={(e) => setReplyBody(e.currentTarget.value)} placeholder="Write your reply..."
                        variant="unstyled" minRows={5} styles={{ input: { padding: '12px 14px', fontSize: 14 } }}
                      />
                      <Box sx={{ padding: '10px 14px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
                        <Button size="sm" radius="xl" loading={sendMutation.isLoading} onClick={handleReply}
                          leftIcon={<IconSend size={14} />}
                          sx={{ background: 'linear-gradient(135deg, #1a73e8, #1557b0)' }}
                        >
                          Send reply
                        </Button>
                        <CloseButton size="sm" onClick={() => setReplyOpen(false)} />
                      </Box>
                    </Box>
                  ) : (
                    <Box onClick={() => setReplyOpen(true)}
                      sx={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', cursor: 'text', '&:hover': { borderColor: '#93c5fd', boxShadow: '0 0 0 3px rgba(59,130,246,.1)' }, transition: 'all 120ms' }}
                    >
                      <Group spacing={8}>
                        <Avatar size={28} radius="xl" sx={{ backgroundColor: avatarColor('Admin') }}>
                          <Text size="xs" weight={700} color="white">A</Text>
                        </Avatar>
                        <Text size="sm" color="dimmed">Reply to {selectedEmail.from}...</Text>
                      </Group>
                    </Box>
                  )}
                </Box>
              </ScrollArea>
            )}
          </Box>
        )}
      </Box>

      {/* ── Compose Window ───────────────────────────────────── */}
      {composeOpen && (
        <Box className={classes.composeWindow}>
          <Box className={classes.composeHeader} onClick={() => setComposeMinimized((m) => !m)}>
            <Group spacing={8}>
              <IconWriting size={16} />
              <Text size="sm" weight={600}>New Message</Text>
            </Group>
            <Group spacing={4}>
              <ActionIcon size="xs" variant="transparent" sx={{ color: 'white' }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setComposeMinimized((m) => !m); }}>
                <IconChevronDown size={14} />
              </ActionIcon>
              <CloseButton size="sm" iconSize={14} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,.2)' } }}
                onClick={(e) => { e.stopPropagation(); setComposeOpen(false); }} />
            </Group>
          </Box>
          {!composeMinimized && (
            <>
              <Box className={classes.composeField}>
                <Text size="xs" color="dimmed" sx={{ width: 44 }}>To</Text>
                <input value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#111827', padding: '6px 0', background: 'transparent' }} />
              </Box>
              <Box className={classes.composeField}>
                <Text size="xs" color="dimmed" sx={{ width: 44 }}>Subject</Text>
                <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#111827', padding: '6px 0', background: 'transparent' }} />
              </Box>
              <Box sx={{ flex: 1, padding: '12px 16px' }}>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)}
                  style={{ width: '100%', height: 320, border: 'none', outline: 'none', resize: 'none', fontSize: 14, fontFamily: 'inherit', color: '#111827', lineHeight: 1.7, background: 'transparent' }}
                />
              </Box>
              <Box className={classes.composeFooter}>
                <Button size="sm" radius="xl" loading={sendMutation.isLoading} onClick={handleSend}
                  leftIcon={<IconSend size={14} />}
                  sx={{ background: 'linear-gradient(135deg, #1a73e8, #1557b0)' }}
                >
                  Send
                </Button>
                <Box sx={{ flex: 1 }} />
                <Tooltip label="Discard">
                  <ActionIcon variant="subtle" color="red" radius="md" onClick={() => setComposeOpen(false)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: any) => {
    try { await checkAuthorizationForPage(context, 'admin:dashboards'); }
    catch { return { redirect: { destination: '/dashboard', permanent: false } }; }
    return { props: {} };
  },
});
