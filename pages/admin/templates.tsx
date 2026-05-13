import { useState, useMemo } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useMutation } from '@tanstack/react-query';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  createStyles,
  Divider,
  Group,
  Modal,
  rem,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  CloseButton,
} from '@mantine/core';
import {
  IconCheck,
  IconDeviceFloppy,
  IconEdit,
  IconEye,
  IconHeadset,
  IconMail,
  IconSend,
  IconUserPlus,
  IconVariable,
  IconX,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';

// ─── Types ───────────────────────────────────────────────────────────────────

type TemplateCategory = 'onboarding' | 'enrollment' | 'support';

type TemplateVariable = {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
};

type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: TemplateVariable[];
};

// ─── Template Data ────────────────────────────────────────────────────────────

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome / Account Created',
    description: 'Sent when a new learner account is created by the admin.',
    category: 'onboarding',
    subject: 'Welcome to {{platformName}} — Your account is ready',
    body: `Dear {{learnerName}},

Welcome to {{platformName}}! We're excited to have you on board.

Your account has been created and you're all set to begin your learning journey. To get started, please set up your password using the link below:

{{loginLink}}

Once logged in, you'll have access to your enrolled courses and learning resources.

If you have any questions or need assistance, don't hesitate to reach out to our support team at {{supportEmail}}.

Happy learning!

Best regards,
The {{platformName}} Team`,
    variables: [
      { key: 'learnerName', label: 'Learner Name', placeholder: 'e.g. John Doe', required: true },
      { key: 'platformName', label: 'Platform Name', placeholder: 'e.g. XaktiNow LMS', required: true },
      { key: 'loginLink', label: 'Login / Setup Link', placeholder: 'e.g. https://lms.example.com/setup', required: true },
      { key: 'supportEmail', label: 'Support Email', placeholder: 'e.g. support@example.com', required: false },
    ],
  },
  {
    id: 'enrollment',
    name: 'Enrollment Confirmation',
    description: 'Confirms a learner has been enrolled in a course.',
    category: 'enrollment',
    subject: "You're now enrolled in {{courseName}}!",
    body: `Dear {{learnerName}},

Great news! You have been successfully enrolled in the following course:

Course: {{courseName}}
Enrollment Date: {{enrollmentDate}}

You can access your course at any time by logging into the platform:

{{courseLink}}

Here's what you can expect:
• Full access to all course modules and materials
• Ability to track your progress and resume where you left off
• Access to any resources and attachments included in the course

If you have any questions about the course or your enrollment, please contact us at {{supportEmail}}.

We wish you the very best in your learning journey!

Best regards,
The {{platformName}} Team`,
    variables: [
      { key: 'learnerName', label: 'Learner Name', placeholder: 'e.g. John Doe', required: true },
      { key: 'courseName', label: 'Course Name', placeholder: 'e.g. Python Programming', required: true },
      { key: 'enrollmentDate', label: 'Enrollment Date', placeholder: 'e.g. 13 May 2026', required: true },
      { key: 'courseLink', label: 'Course Link', placeholder: 'e.g. https://lms.example.com/course/1', required: true },
      { key: 'platformName', label: 'Platform Name', placeholder: 'e.g. XaktiNow LMS', required: false },
      { key: 'supportEmail', label: 'Support Email', placeholder: 'e.g. support@example.com', required: false },
    ],
  },
  {
    id: 'issue-acknowledged',
    name: 'Issue Acknowledged',
    description: 'Auto-reply sent when a learner contacts support.',
    category: 'support',
    subject: "We've received your message — {{platformName}} Support",
    body: `Dear {{learnerName}},

Thank you for reaching out to us. This is to confirm that we have received your message and our support team is looking into it.

Your issue summary:
"{{issueDescription}}"

What happens next:
• Our team will review your message within 24 hours
• You will receive a follow-up email with a resolution or further questions
• For urgent matters, you may reply directly to this email

We appreciate your patience and apologise for any inconvenience caused.

Best regards,
The {{platformName}} Support Team`,
    variables: [
      { key: 'learnerName', label: 'Learner Name', placeholder: 'e.g. John Doe', required: true },
      { key: 'issueDescription', label: 'Issue Description', placeholder: 'e.g. Cannot access Module 3 videos', required: true },
      { key: 'platformName', label: 'Platform Name', placeholder: 'e.g. XaktiNow LMS', required: false },
    ],
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TemplateCategory, { color: string; label: string; icon: React.FC<any> }> = {
  onboarding: { color: 'violet', label: 'Onboarding', icon: IconUserPlus },
  enrollment: { color: 'blue', label: 'Enrollment', icon: IconMail },
  support: { color: 'red', label: 'Support', icon: IconHeadset },
};

const useStyles = createStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    gap: 0,
    overflow: 'hidden',
  },

  sidebar: {
    width: 280,
    minWidth: 280,
    borderRight: `${rem(1)} solid ${theme.colors.gray[2]}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'white',
  },

  sidebarHeader: {
    padding: `${rem(16)} ${rem(16)} ${rem(12)}`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
    flexShrink: 0,
  },

  templateCard: {
    padding: `${rem(14)} ${rem(16)}`,
    cursor: 'pointer',
    borderLeft: `3px solid transparent`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[1]}`,
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },

  templateCardActive: {
    borderLeft: `3px solid ${theme.colors.blue[6]}`,
    backgroundColor: theme.colors.blue[0],
    '&:hover': { backgroundColor: theme.colors.blue[0] },
  },

  editorPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },

  editorHeader: {
    padding: `${rem(16)} ${rem(24)}`,
    backgroundColor: 'white',
    borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
    flexShrink: 0,
  },

  editorBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: rem(24),
  },

  card: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: rem(20),
    marginBottom: rem(16),
  },

  variableChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: `${rem(3)} ${rem(10)}`,
    borderRadius: rem(20),
    backgroundColor: theme.colors.blue[0],
    border: `1px solid ${theme.colors.blue[2]}`,
    cursor: 'pointer',
    fontSize: rem(12),
    fontFamily: 'monospace',
    color: theme.colors.blue[7],
    fontWeight: 600,
    '&:hover': { backgroundColor: theme.colors.blue[1] },
  },

  previewBox: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: rem(24),
    fontFamily: 'Arial, sans-serif',
    fontSize: rem(14),
    lineHeight: 1.7,
    color: '#202124',
  },

  previewVar: {
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    padding: `0 ${rem(4)}`,
    fontWeight: 600,
    color: '#856404',
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderWithVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

function highlightVarsForPreview(text: string, vars: Record<string, string>): React.ReactNode[] {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(\w+)\}\}$/);
    if (match) {
      const val = vars[match[1]];
      return val ? (
        <span key={i} style={{ backgroundColor: '#d4edda', borderRadius: 3, padding: '0 4px', color: '#155724', fontWeight: 600 }}>
          {val}
        </span>
      ) : (
        <span key={i} style={{ backgroundColor: '#fff3cd', borderRadius: 3, padding: '0 4px', color: '#856404', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return part.split('\n').reduce((acc: React.ReactNode[], line, idx, arr) => {
      acc.push(line);
      if (idx < arr.length - 1) acc.push(<br key={`${i}-${idx}`} />);
      return acc;
    }, []);
  });
}

// ─── Send Modal ───────────────────────────────────────────────────────────────

function SendModal({
  template,
  opened,
  onClose,
}: {
  template: EmailTemplate;
  opened: boolean;
  onClose: () => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string | null>('fill');

  const setVar = (key: string, value: string) =>
    setVarValues((prev) => ({ ...prev, [key]: value }));

  const renderedSubject = renderWithVars(template.subject, varValues);
  const renderedBody = renderWithVars(template.body, varValues);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post('/api/emails/send', {
        to: recipientEmail,
        subject: renderedSubject,
        body: renderedBody,
      });
      return res.data;
    },
    onSuccess: () => {
      notify({ type: 'success', message: 'Email sent successfully' });
      onClose();
      setRecipientEmail('');
      setVarValues({});
      setActiveTab('fill');
    },
    onError: () => notify({ type: 'error', message: 'Failed to send email' }),
  });

  const handleSend = () => {
    if (!recipientEmail) {
      notify({ type: 'error', message: 'Please enter a recipient email' });
      return;
    }
    const missing = template.variables.filter((v) => v.required && !varValues[v.key]);
    if (missing.length > 0) {
      notify({ type: 'error', message: `Please fill in: ${missing.map((v) => v.label).join(', ')}` });
      return;
    }
    sendMutation.mutate();
  };

  const meta = CATEGORY_META[template.category];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group spacing="xs">
          <IconSend size={18} color="#1a73e8" />
          <Text weight={600}>Use Template: {template.name}</Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="fill" icon={<IconEdit size={14} />}>Fill Variables</Tabs.Tab>
          <Tabs.Tab value="preview" icon={<IconEye size={14} />}>Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="fill">
          <Stack spacing="sm">
            <TextInput
              label="Recipient Email"
              placeholder="learner@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.currentTarget.value)}
              withAsterisk
              icon={<IconMail size={14} />}
            />

            <Divider label="Template Variables" labelPosition="center" />

            {template.variables.map((variable) => (
              <TextInput
                key={variable.key}
                label={
                  <Group spacing={4}>
                    <Text size="sm">{variable.label}</Text>
                    <Text size="xs" color="dimmed" sx={{ fontFamily: 'monospace' }}>{`{{${variable.key}}}`}</Text>
                    {variable.required && <Text color="red" size="xs">*</Text>}
                  </Group>
                }
                placeholder={variable.placeholder}
                value={varValues[variable.key] || ''}
                onChange={(e) => setVar(variable.key, e.currentTarget.value)}
              />
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="preview">
          <Stack spacing="sm">
            <Box>
              <Text size="xs" color="dimmed" weight={600} mb={4}>TO</Text>
              <Text size="sm">{recipientEmail || <em style={{ color: '#9aa0a6' }}>Not filled</em>}</Text>
            </Box>
            <Box>
              <Text size="xs" color="dimmed" weight={600} mb={4}>SUBJECT</Text>
              <Text size="sm" weight={500}>
                {highlightVarsForPreview(template.subject, varValues)}
              </Text>
            </Box>
            <Divider />
            <Box
              sx={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.7,
                fontFamily: 'Arial, sans-serif',
                color: '#202124',
              }}
            >
              {highlightVarsForPreview(template.body, varValues)}
            </Box>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group position="right" mt="xl">
        <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
        <Button
          leftIcon={<IconSend size={14} />}
          loading={sendMutation.isLoading}
          onClick={handleSend}
          sx={{ backgroundColor: '#1a73e8', '&:hover': { backgroundColor: '#1557b0' } }}
        >
          Send Email
        </Button>
      </Group>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { classes, cx } = useStyles();

  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>('welcome');
  const [activeTab, setActiveTab] = useState<string | null>('edit');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Local edits per template
  const [editMap, setEditMap] = useState<Record<string, { subject: string; body: string }>>({});

  const selected = templates.find((t) => t.id === selectedId)!;
  const edits = editMap[selectedId] ?? { subject: selected.subject, body: selected.body };

  const setEdits = (patch: Partial<{ subject: string; body: string }>) =>
    setEditMap((prev) => ({
      ...prev,
      [selectedId]: { ...edits, ...patch },
    }));

  const isDirty =
    edits.subject !== selected.subject || edits.body !== selected.body;

  const handleSave = () => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? { ...t, subject: edits.subject, body: edits.body }
          : t
      )
    );
    setSavedId(selectedId);
    setTimeout(() => setSavedId(null), 2000);
    notify({ type: 'success', message: 'Template saved' });
  };

  const handleInsertVariable = (key: string) => {
    setEdits({ body: edits.body + `{{${key}}}` });
  };

  const previewVars = useMemo(() => {
    const map: Record<string, string> = {};
    selected.variables.forEach((v) => {
      if (v.key !== 'learnerName') {
        map[v.key] = v.placeholder.replace('e.g. ', '');
      }
    });
    return map;
  }, [selected]);

  const meta = CATEGORY_META[selected.category];

  return (
    <AdminLayout noPadding>
      <Box className={classes.root}>
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <Box className={classes.sidebar}>
          <Box className={classes.sidebarHeader}>
            <Group spacing="xs" mb={4}>
              <IconMail size={18} color="#1a73e8" />
              <Title order={5} weight={700}>Email Templates</Title>
            </Group>
            <Text size="xs" color="dimmed">{templates.length} templates</Text>
          </Box>

          <ScrollArea sx={{ flex: 1 }} type="hover">
            {templates.map((t) => {
              const m = CATEGORY_META[t.category];
              const hasEdits = editMap[t.id] &&
                (editMap[t.id].subject !== t.subject || editMap[t.id].body !== t.body);
              return (
                <Box
                  key={t.id}
                  className={cx(classes.templateCard, { [classes.templateCardActive]: selectedId === t.id })}
                  onClick={() => setSelectedId(t.id)}
                >
                  <Group position="apart" mb={4} noWrap>
                    <Group spacing={6} noWrap>
                      <m.icon size={14} />
                      <Text size="sm" weight={600} lineClamp={1}>{t.name}</Text>
                    </Group>
                    {hasEdits && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1a73e8', flexShrink: 0 }} />
                    )}
                  </Group>
                  <Badge size="xs" color={m.color} variant="light">{m.label}</Badge>
                  <Text size="xs" color="dimmed" mt={4} lineClamp={2}>{t.description}</Text>
                </Box>
              );
            })}
          </ScrollArea>
        </Box>

        {/* ── Editor Pane ──────────────────────────────────────────────── */}
        <Box className={classes.editorPane}>
          {/* Header */}
          <Box className={classes.editorHeader}>
            <Group position="apart" align="flex-start">
              <Box>
                <Group spacing="xs" mb={4}>
                  <meta.icon size={18} />
                  <Title order={4} weight={700}>{selected.name}</Title>
                  <Badge color={meta.color} variant="light" size="sm">{meta.label}</Badge>
                </Group>
                <Text size="xs" color="dimmed">{selected.description}</Text>
              </Box>
              <Group spacing="xs">
                {isDirty && (
                  <Button
                    size="sm"
                    variant="light"
                    leftIcon={savedId === selectedId ? <IconCheck size={14} /> : <IconDeviceFloppy size={14} />}
                    onClick={handleSave}
                    color={savedId === selectedId ? 'green' : 'blue'}
                  >
                    {savedId === selectedId ? 'Saved!' : 'Save Changes'}
                  </Button>
                )}
                <Button
                  size="sm"
                  leftIcon={<IconSend size={14} />}
                  onClick={() => setSendModalOpen(true)}
                  sx={{ backgroundColor: '#1a73e8', '&:hover': { backgroundColor: '#1557b0' } }}
                >
                  Use Template
                </Button>
              </Group>
            </Group>
          </Box>

          {/* Tabs */}
          <Box className={classes.editorBody}>
            <Tabs value={activeTab} onTabChange={setActiveTab} variant="outline">
              <Tabs.List mb="md">
                <Tabs.Tab value="edit" icon={<IconEdit size={14} />}>Edit</Tabs.Tab>
                <Tabs.Tab value="preview" icon={<IconEye size={14} />}>Preview</Tabs.Tab>
              </Tabs.List>

              {/* ── Edit Tab ────────────────────────────────────────── */}
              <Tabs.Panel value="edit">
                {/* Subject */}
                <Box className={classes.card}>
                  <Text size="xs" weight={700} color="dimmed" mb="xs" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Subject Line
                  </Text>
                  <TextInput
                    value={edits.subject}
                    onChange={(e) => setEdits({ subject: e.currentTarget.value })}
                    placeholder="Email subject..."
                    styles={{
                      input: { fontSize: 15, fontWeight: 500, border: '1px solid #e0e0e0', borderRadius: 8 },
                    }}
                  />
                </Box>

                {/* Body */}
                <Box className={classes.card}>
                  <Group position="apart" mb="xs">
                    <Text size="xs" weight={700} color="dimmed" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Email Body
                    </Text>
                    <Text size="xs" color="dimmed">{edits.body.length} chars</Text>
                  </Group>
                  <Textarea
                    value={edits.body}
                    onChange={(e) => setEdits({ body: e.currentTarget.value })}
                    minRows={16}
                    styles={{
                      input: {
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: 1.7,
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        resize: 'vertical',
                      },
                    }}
                  />
                </Box>

                {/* Variables panel */}
                <Box className={classes.card}>
                  <Group spacing="xs" mb="sm">
                    <IconVariable size={16} color="#5f6368" />
                    <Text size="xs" weight={700} color="dimmed" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Available Variables
                    </Text>
                  </Group>
                  <Text size="xs" color="dimmed" mb="sm">
                    Click a variable to insert it at the end of the email body.
                  </Text>
                  <Group spacing="xs">
                    {selected.variables.map((v) => (
                      <Tooltip key={v.key} label={v.label} withArrow position="top">
                        <Box
                          className={classes.variableChip}
                          onClick={() => handleInsertVariable(v.key)}
                        >
                          {`{{${v.key}}}`}
                          {v.required && <Text color="red" size="xs" sx={{ lineHeight: 1 }}>*</Text>}
                        </Box>
                      </Tooltip>
                    ))}
                  </Group>
                  <Divider my="sm" />
                  <Group spacing="xl">
                    {selected.variables.map((v) => (
                      <Box key={v.key}>
                        <Text size="xs" weight={600} sx={{ fontFamily: 'monospace', color: '#1a73e8' }}>
                          {`{{${v.key}}}`}
                        </Text>
                        <Text size="xs" color="dimmed">{v.label}{v.required ? ' (required)' : ''}</Text>
                      </Box>
                    ))}
                  </Group>
                </Box>
              </Tabs.Panel>

              {/* ── Preview Tab ─────────────────────────────────────── */}
              <Tabs.Panel value="preview">
                <Box className={classes.card} mb="md">
                  <Text size="xs" weight={700} color="dimmed" mb={6} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Subject
                  </Text>
                  <Text size="sm" weight={600}>
                    {highlightVarsForPreview(edits.subject, previewVars)}
                  </Text>
                </Box>

                <Box className={classes.card}>
                  <Group position="apart" mb="md">
                    <Text size="xs" weight={700} color="dimmed" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Email Body Preview
                    </Text>
                    <Group spacing={4}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d4edda' }} />
                      <Text size="xs" color="green">Filled</Text>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff3cd', marginLeft: 8 }} />
                      <Text size="xs" color="dimmed">Unfilled</Text>
                    </Group>
                  </Group>

                  <Box
                    sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      padding: '24px 28px',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: '#202124',
                      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                    }}
                  >
                    {/* Mock email header */}
                    <Box
                      sx={{
                        borderBottom: '2px solid #1a73e8',
                        paddingBottom: 12,
                        marginBottom: 20,
                      }}
                    >
                      <Text size="lg" weight={700} color="#1a73e8">
                        {selected.name === 'Welcome / Account Created'
                          ? 'Welcome!'
                          : selected.name === 'Enrollment Confirmation'
                          ? "You're Enrolled!"
                          : selected.name === 'Issue Acknowledged'
                          ? 'We Received Your Message'
                          : 'Announcement'}
                      </Text>
                    </Box>

                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {highlightVarsForPreview(edits.body, previewVars)}
                    </div>

                    {/* Mock footer */}
                    <Box
                      sx={{
                        borderTop: '1px solid #e0e0e0',
                        marginTop: 24,
                        paddingTop: 16,
                        color: '#9aa0a6',
                        fontSize: 12,
                      }}
                    >
                      This email was sent from the LMS Platform. Please do not reply to this email.
                    </Box>
                  </Box>
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Box>
        </Box>
      </Box>

      {/* ── Send Modal ──────────────────────────────────────────────────── */}
      <SendModal
        template={{ ...selected, subject: edits.subject, body: edits.body }}
        opened={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
      />
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: any) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');
    return { props: {} };
  },
});
