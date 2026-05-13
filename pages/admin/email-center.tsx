import { useState, useMemo } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Divider,
  Group,
  ScrollArea,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  Badge,
  rem,
  createStyles,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconArchive,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconInbox,
  IconInfoCircle,
  IconMail,
  IconMailOpened,
  IconPaperclip,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconSend,
  IconStar,
  IconStarFilled,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import { useMutation } from '@tanstack/react-query';

// ─── Types ──────────────────────────────────────────────────────────────────

type Folder = 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash';
type Category = 'primary' | 'social' | 'promotions';

type Email = {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: Folder;
  category: Category;
  hasAttachment?: boolean;
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const INITIAL_EMAILS: Email[] = [
  {
    id: '1',
    from: 'Ahmed Hassan',
    fromEmail: 'ahmed.hassan@example.com',
    to: 'Admin',
    toEmail: 'admin@lms.com',
    subject: 'Question about Python course module 3',
    preview: "Hello, I'm having trouble accessing module 3 of the Python course. The videos won't load on my end...",
    body: `Hello,\n\nI'm having trouble accessing module 3 of the Python course. The videos won't load on my end and I've tried multiple browsers.\n\nCould you please help me resolve this issue?\n\nBest regards,\nAhmed Hassan`,
    date: new Date('2026-05-13T10:30:00'),
    read: false,
    starred: true,
    folder: 'inbox',
    category: 'primary',
  },
  {
    id: '2',
    from: 'Sara Mitchell',
    fromEmail: 'sara.mitchell@example.com',
    to: 'Admin',
    toEmail: 'admin@lms.com',
    subject: 'Certificate request for ServiceNow course',
    preview: "Hi, I have completed all modules in the ServiceNow course and would like to request my completion certificate...",
    body: `Hi,\n\nI have completed all modules in the ServiceNow course and would like to request my completion certificate.\n\nMy completion date was May 10, 2026.\n\nThank you,\nSara Mitchell`,
    date: new Date('2026-05-13T09:15:00'),
    read: false,
    starred: false,
    folder: 'inbox',
    category: 'primary',
  },
  {
    id: '3',
    from: 'James Rodriguez',
    fromEmail: 'james.r@example.com',
    to: 'Admin',
    toEmail: 'admin@lms.com',
    subject: 'Login issue — password reset not working',
    preview: "I tried resetting my password but the reset link keeps expiring before I can use it...",
    body: `Hello Support,\n\nI tried resetting my password but the reset link keeps expiring before I can use it. I've requested it 3 times now.\n\nPlease help ASAP as I have a deadline for the course.\n\nRegards,\nJames Rodriguez`,
    date: new Date('2026-05-12T16:45:00'),
    read: true,
    starred: false,
    folder: 'inbox',
    category: 'primary',
  },
  {
    id: '4',
    from: 'System Notification',
    fromEmail: 'noreply@lms.com',
    to: 'Admin',
    toEmail: 'admin@lms.com',
    subject: '15 new learners enrolled this week',
    preview: 'Weekly enrollment summary: 15 new learners joined the platform between May 6–12...',
    body: `Weekly Enrollment Summary\n\n15 new learners joined the platform between May 6–12, 2026.\n\nTop courses:\n• Python Programming — 6 enrollments\n• ServiceNow Fundamentals — 5 enrollments\n• AI & Machine Learning — 4 enrollments\n\nView the full report in your dashboard.`,
    date: new Date('2026-05-12T08:00:00'),
    read: true,
    starred: false,
    folder: 'inbox',
    category: 'social',
  },
  {
    id: '5',
    from: 'LinkedIn Learning',
    fromEmail: 'newsletter@linkedin.com',
    to: 'Admin',
    toEmail: 'admin@lms.com',
    subject: 'New courses trending in your industry',
    preview: 'Discover the top courses your peers are taking this month. Artificial Intelligence, Cloud Computing...',
    body: `Discover the top courses your peers are taking this month.\n\n• Artificial Intelligence for Business Leaders\n• Cloud Computing Essentials\n• Agile Project Management\n\nExplore now on LinkedIn Learning.`,
    date: new Date('2026-05-11T14:00:00'),
    read: true,
    starred: false,
    folder: 'inbox',
    category: 'promotions',
  },
  {
    id: '6',
    from: 'Admin',
    fromEmail: 'admin@lms.com',
    to: 'Ahmed Hassan',
    toEmail: 'ahmed.hassan@example.com',
    subject: 'Re: Question about Python course module 3',
    preview: 'Hi Ahmed, Thank you for reaching out. I have looked into the issue and it appears the video CDN had a temporary...',
    body: `Hi Ahmed,\n\nThank you for reaching out. I have looked into the issue and it appears the video CDN had a temporary outage earlier today.\n\nThe issue has been resolved and you should now be able to access all videos in module 3. Please try refreshing your browser cache (Ctrl+Shift+R) and let me know if the problem persists.\n\nBest regards,\nLMS Admin Team`,
    date: new Date('2026-05-13T11:00:00'),
    read: true,
    starred: false,
    folder: 'sent',
    category: 'primary',
  },
  {
    id: '7',
    from: 'Admin',
    fromEmail: 'admin@lms.com',
    to: 'New Learners (Batch)',
    toEmail: 'batch@lms.com',
    subject: 'Welcome to the LMS Platform — Your account is ready',
    preview: 'Welcome! Your account has been created on our Learning Management System. Please use the link below to set...',
    body: `Welcome to the LMS Platform!\n\nYour account has been created. Please use the link below to set your password and get started.\n\nIf you have any questions, reply to this email and our team will assist you.\n\nHappy learning!\nLMS Admin Team`,
    date: new Date('2026-05-10T09:00:00'),
    read: true,
    starred: false,
    folder: 'sent',
    category: 'primary',
    hasAttachment: false,
  },
  {
    id: '8',
    from: 'Admin',
    fromEmail: 'admin@lms.com',
    to: 'Sara Mitchell',
    toEmail: 'sara.mitchell@example.com',
    subject: 'Your ServiceNow completion certificate',
    preview: 'Dear Sara, Congratulations on completing the ServiceNow Fundamentals course! Please find your certificate...',
    body: `Dear Sara,\n\nCongratulations on completing the ServiceNow Fundamentals course!\n\nYour certificate of completion is being processed and will be emailed to you within 2 business days.\n\nWell done!\nLMS Admin Team`,
    date: new Date('2026-05-13T12:30:00'),
    read: true,
    starred: false,
    folder: 'sent',
    category: 'primary',
  },
  {
    id: '9',
    from: 'Admin',
    fromEmail: 'admin@lms.com',
    to: 'All Learners',
    toEmail: 'learners@lms.com',
    subject: 'Platform maintenance this Saturday 2–4 AM',
    preview: 'Dear Learners, We will be performing scheduled maintenance on Saturday, May 16 from 2:00 AM to 4:00 AM...',
    body: `Dear Learners,\n\nWe will be performing scheduled maintenance on Saturday, May 16 from 2:00 AM to 4:00 AM (UTC).\n\nThe platform will be briefly unavailable during this window. We apologise for the inconvenience.\n\nThank you for your understanding.\nLMS Admin Team`,
    date: new Date('2026-05-09T10:00:00'),
    read: true,
    starred: false,
    folder: 'drafts',
    category: 'primary',
  },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    backgroundColor: '#f6f8fc',
    overflow: 'hidden',
  },

  // Gmail left sidebar
  gmailSidebar: {
    width: 256,
    minWidth: 256,
    backgroundColor: '#f6f8fc',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
    flexShrink: 0,
    overflowY: 'auto',
  },
  composeBtn: {
    margin: '8px 8px 16px 8px',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#c2e7ff',
    color: '#001d35',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 24px',
    boxShadow: '0 1px 2px rgba(0,0,0,.08)',
    '&:hover': {
      backgroundColor: '#a8d8f5',
      boxShadow: '0 2px 6px rgba(0,0,0,.12)',
    },
  },
  folderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    height: 32,
    borderRadius: '0 16px 16px 0',
    marginRight: 16,
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    color: '#202124',
    userSelect: 'none' as const,
    '&:hover': { backgroundColor: '#e2e6ea' },
  },
  folderItemActive: {
    backgroundColor: '#d3e3fd',
    fontWeight: 700,
    color: '#041e49',
    '&:hover': { backgroundColor: '#d3e3fd' },
  },

  // Middle pane — email list
  listPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'white',
    borderRadius: '16px 0 0 16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: `1px solid #e0e0e0`,
  },
  listToolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid #e0e0e0',
    gap: 8,
    minHeight: 56,
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#eaf1fb',
    border: 'none',
    borderRadius: 24,
    height: 40,
    padding: '0 16px 0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'text',
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    height: 52,
    cursor: 'pointer',
    borderBottom: '1px solid #f1f3f4',
    gap: 8,
    flexShrink: 0,
    '&:hover': { backgroundColor: '#f2f6fc', boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  },
  emailRowUnread: {
    backgroundColor: 'white',
    '& $emailFrom': { fontWeight: 700, color: '#202124' },
    '& $emailSubject': { fontWeight: 700, color: '#202124' },
  },
  emailRowRead: {
    backgroundColor: '#f2f2f2',
  },
  emailRowSelected: {
    backgroundColor: '#e8f0fe !important',
  },
  emailFrom: {
    fontSize: 14,
    color: '#202124',
    width: 180,
    minWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontWeight: 400,
  },
  emailSubjectLine: {
    flex: 1,
    fontSize: 14,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: '#202124',
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  emailSubject: {
    fontWeight: 400,
  },
  emailPreview: {
    color: '#5f6368',
    fontWeight: 400,
  },
  emailDate: {
    fontSize: 12,
    color: '#5f6368',
    minWidth: 60,
    textAlign: 'right' as const,
    flexShrink: 0,
  },

  // Right pane — email detail
  detailPane: {
    width: 520,
    minWidth: 520,
    backgroundColor: 'white',
    borderRadius: '0 16px 16px 0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  detailHeader: {
    padding: '16px 24px 12px',
    borderBottom: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 24px',
  },

  // Compose window
  composeWindow: {
    position: 'fixed' as const,
    bottom: 0,
    right: 24,
    width: 540,
    backgroundColor: 'white',
    borderRadius: '8px 8px 0 0',
    boxShadow: '0 8px 10px 1px rgba(0,0,0,.14),0 3px 14px 2px rgba(0,0,0,.12),0 5px 5px -3px rgba(0,0,0,.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  composeHeader: {
    backgroundColor: '#404040',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px 8px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none' as const,
    flexShrink: 0,
  },
  composeField: {
    borderBottom: '1px solid #e0e0e0',
    padding: '4px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  composeBody: {
    flex: 1,
    padding: '8px 16px',
    minHeight: 200,
  },
  composeFooter: {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderTop: '1px solid #e0e0e0',
    flexShrink: 0,
  },

  // Category tabs
  categoryTab: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    color: '#5f6368',
    borderBottom: '3px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    '&:hover': { backgroundColor: '#f2f6fc' },
  },
  categoryTabActive: {
    color: '#1a73e8',
    borderBottom: '3px solid #1a73e8',
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = ['#1a73e8', '#e91e63', '#9c27b0', '#ff5722', '#00897b', '#f4511e', '#0b8043'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarButton({ starred, onClick }: { starred: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <ActionIcon
      size="sm"
      variant="transparent"
      onClick={onClick}
      sx={{ color: starred ? '#f4b400' : '#9aa0a6', '&:hover': { color: starred ? '#f4b400' : '#5f6368' } }}
    >
      {starred ? <IconStarFilled size={16} /> : <IconStar size={16} />}
    </ActionIcon>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmailCenterPage() {
  const { classes, cx } = useStyles();

  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [activeCategory, setActiveCategory] = useState<Category>('primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Reply state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  const sendMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; body: string }) => {
      const res = await http.post('/api/emails/send', data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      const newEmail: Email = {
        id: String(Date.now()),
        from: 'Admin',
        fromEmail: 'admin@lms.com',
        to: vars.to,
        toEmail: vars.to,
        subject: vars.subject,
        preview: vars.body.slice(0, 80),
        body: vars.body,
        date: new Date(),
        read: true,
        starred: false,
        folder: 'sent',
        category: 'primary',
      };
      setEmails((prev) => [newEmail, ...prev]);
      notify({ type: 'success', message: 'Email sent' });
      setComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    },
    onError: () => notify({ type: 'error', message: 'Failed to send email' }),
  });

  // Derived email list
  const visibleEmails = useMemo(() => {
    let list = emails.filter((e) => e.folder === activeFolder);
    if (activeFolder === 'inbox') list = list.filter((e) => e.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.from.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, activeFolder, activeCategory, searchQuery]);

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;
  const unreadCount = emails.filter((e) => e.folder === 'inbox' && !e.read).length;

  const handleSelectEmail = (email: Email) => {
    setSelectedId(email.id);
    setReplyOpen(false);
    setReplyBody('');
    if (!email.read) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, read: true } : e)));
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) => prev.map((em) => (em.id === id ? { ...em, starred: !em.starred } : em)));
  };

  const handleDelete = (id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: 'trash' } : e)));
    if (selectedId === id) setSelectedId(null);
    notify({ type: 'success', message: 'Moved to Trash' });
  };

  const handleArchive = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    notify({ type: 'success', message: 'Archived' });
  };

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSend = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      notify({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    sendMutation.mutate({ to: composeTo, subject: composeSubject, body: composeBody });
  };

  const handleSendReply = () => {
    if (!replyBody.trim() || !selectedEmail) return;
    const replied: Email = {
      id: String(Date.now()),
      from: 'Admin',
      fromEmail: 'admin@lms.com',
      to: selectedEmail.from,
      toEmail: selectedEmail.fromEmail,
      subject: `Re: ${selectedEmail.subject}`,
      preview: replyBody.slice(0, 80),
      body: replyBody,
      date: new Date(),
      read: true,
      starred: false,
      folder: 'sent',
      category: 'primary',
    };
    setEmails((prev) => [replied, ...prev]);
    sendMutation.mutate({ to: selectedEmail.fromEmail, subject: `Re: ${selectedEmail.subject}`, body: replyBody });
    setReplyOpen(false);
    setReplyBody('');
  };

  const folders: { id: Folder; label: string; icon: React.FC<any> }[] = [
    { id: 'inbox', label: 'Inbox', icon: IconInbox },
    { id: 'starred', label: 'Starred', icon: IconStarFilled },
    { id: 'sent', label: 'Sent', icon: IconSend },
    { id: 'drafts', label: 'Drafts', icon: IconEdit },
    { id: 'trash', label: 'Trash', icon: IconTrash },
  ];

  const categories: { id: Category; label: string; icon: React.FC<any> }[] = [
    { id: 'primary', label: 'Primary', icon: IconInbox },
    { id: 'social', label: 'Social', icon: IconTag },
    { id: 'promotions', label: 'Promotions', icon: IconMail },
  ];

  return (
    <AdminLayout noPadding>
      <Box className={classes.root}>
        {/* ── Gmail Left Sidebar ────────────────────────────────────────── */}
        <Box className={classes.gmailSidebar}>
          {/* Compose button */}
          <Box
            className={classes.composeBtn}
            onClick={() => { setComposeOpen(true); setComposeMinimized(false); }}
          >
            <IconPencil size={20} />
            <Text size="sm" weight={600}>Compose</Text>
          </Box>

          {/* Folder navigation */}
          {folders.map((f) => (
            <Box
              key={f.id}
              className={cx(classes.folderItem, { [classes.folderItemActive]: activeFolder === f.id })}
              onClick={() => { setActiveFolder(f.id); setSelectedId(null); setSearchQuery(''); }}
            >
              <f.icon size={18} stroke={1.8} />
              <Text size="sm" sx={{ flex: 1 }}>{f.label}</Text>
              {f.id === 'inbox' && unreadCount > 0 && (
                <Text size="xs" weight={700}>{unreadCount}</Text>
              )}
            </Box>
          ))}

          <Divider my="xs" mx="md" />

          <Box px="md">
            <Text size="xs" color="dimmed" weight={600} mb={4} sx={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Labels
            </Text>
            {['Announcements', 'Course Updates', 'Learner Support'].map((label) => (
              <Box
                key={label}
                className={classes.folderItem}
                sx={{ paddingLeft: 12, gap: 10 }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: label === 'Announcements' ? '#1a73e8' : label === 'Course Updates' ? '#0b8043' : '#e91e63', flexShrink: 0 }} />
                <Text size="sm">{label}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Email List Pane ───────────────────────────────────────────── */}
        <Box className={classes.listPane} sx={{ borderRadius: selectedEmail ? '16px 0 0 16px' : 16 }}>
          {/* Search + toolbar */}
          <Box className={classes.listToolbar}>
            <Checkbox
              checked={checkedIds.length > 0 && checkedIds.length === visibleEmails.length}
              indeterminate={checkedIds.length > 0 && checkedIds.length < visibleEmails.length}
              onChange={() => setCheckedIds(checkedIds.length === visibleEmails.length ? [] : visibleEmails.map((e) => e.id))}
            />
            <ActionIcon size="sm" variant="transparent" color="gray"><IconChevronDown size={14} /></ActionIcon>

            <Box className={classes.searchBar} sx={{ flex: 1 }}>
              <IconSearch size={18} color="#5f6368" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mail"
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: '#202124' }}
              />
            </Box>

            <Tooltip label="Refresh"><ActionIcon size="sm" variant="transparent" color="gray"><IconRefresh size={16} /></ActionIcon></Tooltip>
            <Tooltip label="More options"><ActionIcon size="sm" variant="transparent" color="gray"><IconChevronDown size={16} /></ActionIcon></Tooltip>
          </Box>

          {/* Category tabs (inbox only) */}
          {activeFolder === 'inbox' && (
            <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
              {categories.map((cat) => (
                <Box
                  key={cat.id}
                  className={cx(classes.categoryTab, { [classes.categoryTabActive]: activeCategory === cat.id })}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <cat.icon size={16} />
                  {cat.label}
                  {cat.id === 'primary' && unreadCount > 0 && (
                    <Badge size="xs" color="blue" variant="filled" sx={{ fontSize: 10 }}>{unreadCount}</Badge>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Email rows */}
          <ScrollArea sx={{ flex: 1 }} type="hover">
            {visibleEmails.length === 0 ? (
              <Center py="xl">
                <Box sx={{ textAlign: 'center' }}>
                  <IconMailOpened size={48} color="#9aa0a6" />
                  <Text color="dimmed" mt="sm">No emails here</Text>
                </Box>
              </Center>
            ) : (
              visibleEmails.map((email) => (
                <Box
                  key={email.id}
                  className={cx(
                    classes.emailRow,
                    email.read ? classes.emailRowRead : classes.emailRowUnread,
                    { [classes.emailRowSelected]: selectedId === email.id }
                  )}
                  onClick={() => handleSelectEmail(email)}
                >
                  <Box onClick={(e: React.MouseEvent) => toggleCheck(email.id, e)}>
                    <Checkbox checked={checkedIds.includes(email.id)} onChange={() => {}} size="sm" />
                  </Box>

                  <StarButton starred={email.starred} onClick={(e) => toggleStar(email.id, e)} />

                  <Text
                    className={classes.emailFrom}
                    weight={email.read ? 400 : 700}
                  >
                    {email.from}
                  </Text>

                  <Box className={classes.emailSubjectLine}>
                    <Text
                      className={classes.emailSubject}
                      weight={email.read ? 400 : 700}
                      size="sm"
                      sx={{ flexShrink: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {email.subject}
                    </Text>
                    <Text className={classes.emailPreview} size="sm">
                      — {email.preview}
                    </Text>
                  </Box>

                  {email.hasAttachment && (
                    <IconPaperclip size={14} color="#5f6368" style={{ flexShrink: 0 }} />
                  )}

                  <Text className={classes.emailDate} weight={email.read ? 400 : 700}>
                    {formatDate(email.date)}
                  </Text>
                </Box>
              ))
            )}
          </ScrollArea>

          {/* Pagination bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '4px 12px', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
            <Text size="xs" color="dimmed" mr="xs">1–{visibleEmails.length} of {visibleEmails.length}</Text>
            <ActionIcon size="sm" variant="transparent" color="gray" disabled><IconChevronLeft size={16} /></ActionIcon>
            <ActionIcon size="sm" variant="transparent" color="gray" disabled><IconChevronRight size={16} /></ActionIcon>
          </Box>
        </Box>

        {/* ── Email Detail Pane ─────────────────────────────────────────── */}
        {selectedEmail && (
          <Box className={classes.detailPane}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
              <Tooltip label="Back">
                <ActionIcon size="sm" variant="transparent" color="gray" onClick={() => setSelectedId(null)}>
                  <IconChevronLeft size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Archive">
                <ActionIcon size="sm" variant="transparent" color="gray" onClick={() => handleArchive(selectedEmail.id)}>
                  <IconArchive size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete">
                <ActionIcon size="sm" variant="transparent" color="gray" onClick={() => handleDelete(selectedEmail.id)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Mark as unread">
                <ActionIcon
                  size="sm"
                  variant="transparent"
                  color="gray"
                  onClick={() => setEmails((prev) => prev.map((e) => e.id === selectedEmail.id ? { ...e, read: false } : e))}
                >
                  <IconMailOpened size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Snooze">
                <ActionIcon size="sm" variant="transparent" color="gray"><IconClock size={18} /></ActionIcon>
              </Tooltip>
              <Box sx={{ flex: 1 }} />
              <Text size="xs" color="dimmed">{formatDate(selectedEmail.date)}</Text>
            </Box>

            <ScrollArea className={classes.detailBody} type="hover">
              {/* Subject */}
              <Group mb="md" spacing="xs" align="center">
                <Text size="xl" weight={400} sx={{ flex: 1, color: '#202124' }}>{selectedEmail.subject}</Text>
                <StarButton starred={selectedEmail.starred} onClick={(e) => toggleStar(selectedEmail.id, e)} />
              </Group>

              {/* Sender row */}
              <Group mb="md" align="flex-start" noWrap>
                <Avatar size={40} radius="xl" color="blue" sx={{ backgroundColor: getAvatarColor(selectedEmail.from), flexShrink: 0 }}>
                  <Text size="sm" weight={700} color="white">{getInitials(selectedEmail.from)}</Text>
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Group spacing={4}>
                    <Text size="sm" weight={600}>{selectedEmail.from}</Text>
                    <Text size="xs" color="dimmed">&lt;{selectedEmail.fromEmail}&gt;</Text>
                  </Group>
                  <Text size="xs" color="dimmed">to {selectedEmail.to}</Text>
                </Box>
                <Box sx={{ flexShrink: 0, display: 'flex', gap: 4 }}>
                  <Tooltip label="Reply">
                    <ActionIcon size="sm" variant="transparent" color="gray" onClick={() => setReplyOpen(true)}>
                      <IconMailOpened size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="More">
                    <ActionIcon size="sm" variant="transparent" color="gray">
                      <IconChevronDown size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Box>
              </Group>

              <Divider mb="md" />

              {/* Body */}
              <Text size="sm" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#202124' }}>
                {selectedEmail.body}
              </Text>

              {/* Reply box */}
              {replyOpen ? (
                <Box
                  mt="xl"
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,.1)',
                  }}
                >
                  <Box sx={{ padding: '8px 16px', borderBottom: '1px solid #e0e0e0' }}>
                    <Text size="xs" color="dimmed">
                      To: <strong>{selectedEmail.from}</strong> &lt;{selectedEmail.fromEmail}&gt;
                    </Text>
                  </Box>
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.currentTarget.value)}
                    placeholder="Reply..."
                    variant="unstyled"
                    minRows={5}
                    styles={{ input: { padding: '12px 16px', fontSize: 14 } }}
                  />
                  <Box sx={{ padding: '8px 16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      size="sm"
                      radius="xl"
                      loading={sendMutation.isLoading}
                      onClick={handleSendReply}
                      leftIcon={<IconSend size={14} />}
                      sx={{ backgroundColor: '#1a73e8', '&:hover': { backgroundColor: '#1557b0' } }}
                    >
                      Send
                    </Button>
                    <ActionIcon size="sm" variant="transparent" color="gray">
                      <IconPaperclip size={16} />
                    </ActionIcon>
                    <Box sx={{ flex: 1 }} />
                    <CloseButton size="sm" onClick={() => setReplyOpen(false)} />
                  </Box>
                </Box>
              ) : (
                <Box
                  mt="xl"
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'text',
                    color: '#5f6368',
                    fontSize: 14,
                    '&:hover': { boxShadow: '0 2px 6px rgba(0,0,0,.1)' },
                  }}
                  onClick={() => setReplyOpen(true)}
                >
                  <Group spacing="xs">
                    <IconMailOpened size={16} color="#5f6368" />
                    <Text size="sm" color="dimmed">Reply to {selectedEmail.from}...</Text>
                  </Group>
                </Box>
              )}
            </ScrollArea>
          </Box>
        )}
      </Box>

      {/* ── Compose Window ────────────────────────────────────────────────── */}
      {composeOpen && (
        <Box className={classes.composeWindow}>
          <Box className={classes.composeHeader} onClick={() => setComposeMinimized((m) => !m)}>
            <Text size="sm" weight={600}>New Message</Text>
            <Group spacing={4}>
              <ActionIcon
                size="xs"
                variant="transparent"
                sx={{ color: 'white' }}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setComposeMinimized((m) => !m); }}
              >
                <IconChevronDown size={14} />
              </ActionIcon>
              <CloseButton
                size="sm"
                iconSize={14}
                sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,.2)' } }}
                onClick={(e) => { e.stopPropagation(); setComposeOpen(false); }}
              />
            </Group>
          </Box>

          {!composeMinimized && (
            <>
              <Box className={classes.composeField}>
                <Text size="xs" color="dimmed" w={40}>To</Text>
                <input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder=""
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#202124', padding: '6px 0' }}
                />
              </Box>
              <Box className={classes.composeField}>
                <Text size="xs" color="dimmed" w={40}>Subject</Text>
                <input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder=""
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#202124', padding: '6px 0' }}
                />
              </Box>
              <Box className={classes.composeBody}>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder=""
                  style={{
                    width: '100%',
                    height: 200,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    color: '#202124',
                    lineHeight: 1.6,
                  }}
                />
              </Box>
              <Box className={classes.composeFooter}>
                <Button
                  size="sm"
                  radius="xl"
                  loading={sendMutation.isLoading}
                  onClick={handleSend}
                  sx={{ backgroundColor: '#1a73e8', '&:hover': { backgroundColor: '#1557b0' } }}
                >
                  Send
                </Button>
                <ActionIcon size="md" variant="transparent" color="gray"><IconPaperclip size={18} /></ActionIcon>
                <ActionIcon size="md" variant="transparent" color="gray"><IconInfoCircle size={18} /></ActionIcon>
                <Box sx={{ flex: 1 }} />
                <Tooltip label="Discard draft">
                  <ActionIcon size="md" variant="transparent" color="gray" onClick={() => setComposeOpen(false)}>
                    <IconTrash size={18} />
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
    await checkAuthorizationForPage(context, 'admin:dashboards');
    return { props: {} };
  },
});
