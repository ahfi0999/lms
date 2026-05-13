import { useState, useEffect } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  createStyles,
  Divider,
  Group,
  Loader,
  Center,
  NumberInput,
  Paper,
  rem,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Textarea,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBell,
  IconCertificate,
  IconCheck,
  IconGlobe,
  IconInfoCircle,
  IconLock,
  IconPlus,
  IconRefreshAlert,
  IconSettings,
  IconShieldCheck,
  IconTrash,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { GetServerSidePropsContext } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = {
  platformName: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  selfEnrollment: boolean;
  defaultBatchCapacity: number;
  waitlistEnabled: boolean;
  notifyOnEnrollment: boolean;
  notifyOnCompletion: boolean;
  notifyOnCertificate: boolean;
  adminAlertEmail: string;
  certificateIssuer: string;
  autoIssueCertificate: boolean;
  allowedDomains: string[];
  sessionTimeoutMinutes: number;
};

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createStyles((theme) => ({
  sidebar: {
    width: rem(240),
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
  },
  sideItem: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(10),
    padding: `${rem(9)} ${rem(12)}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    color: theme.colors.gray[7],
    transition: 'background 120ms',
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },
  sideItemActive: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[7],
    '&:hover': { backgroundColor: theme.colors.blue[0] },
  },
  section: {
    padding: `${rem(28)} ${rem(32)}`,
    borderBottom: `1px solid ${theme.colors.gray[2]}`,
    '&:last-of-type': { borderBottom: 'none' },
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: 700,
    color: theme.colors.gray[8],
    marginBottom: rem(4),
  },
  sectionDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[5],
    marginBottom: rem(20),
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: rem(24),
    padding: `${rem(14)} 0`,
    borderBottom: `1px solid ${theme.colors.gray[1]}`,
    '&:last-of-type': { borderBottom: 'none' },
  },
  fieldLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 600,
    color: theme.colors.gray[8],
  },
  fieldHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray[5],
    marginTop: rem(2),
  },
  dangerZone: {
    border: `1px solid ${theme.colors.red[3]}`,
    borderRadius: theme.radius.md,
    padding: `${rem(20)} ${rem(24)}`,
    backgroundColor: theme.colors.red[0],
  },
}));

// ─── Nav sections ─────────────────────────────────────────────────────────────

type SectionId = 'general' | 'enrollment' | 'notifications' | 'certificates' | 'security' | 'danger';

const NAV: { id: SectionId; label: string; icon: React.FC<any> }[] = [
  { id: 'general',       label: 'General',       icon: IconSettings      },
  { id: 'enrollment',    label: 'Enrollment',     icon: IconUsers         },
  { id: 'notifications', label: 'Notifications',  icon: IconBell          },
  { id: 'certificates',  label: 'Certificates',   icon: IconCertificate   },
  { id: 'security',      label: 'Security',       icon: IconShieldCheck   },
  { id: 'danger',        label: 'Danger Zone',    icon: IconAlertTriangle },
];

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { classes } = useStyles();
  return (
    <Box className={classes.fieldRow}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Text className={classes.fieldLabel}>{label}</Text>
        {hint && <Text className={classes.fieldHint}>{hint}</Text>}
      </Box>
      <Box sx={{ flexShrink: 0, width: rem(380) }}>{children}</Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function SettingsPage() {
  const { classes, cx } = useStyles();
  const qc = useQueryClient();
  const [active, setActive] = useState<SectionId>('general');
  const [form, setForm] = useState<Settings | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [purging, setPurging] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => http.get('/api/settings').then((r) => r.data),
  });

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Settings>) => http.put('/api/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      notify({ type: 'success', message: 'Settings saved successfully.' });
    },
    onError: () => notify({ type: 'error', message: 'Failed to save settings.' }),
  });

  function patch(updates: Partial<Settings>) {
    if (!form) return;
    setForm((f) => ({ ...f!, ...updates }));
  }

  function save() {
    if (form) mutation.mutate(form);
  }

  function addDomain() {
    const d = domainInput.trim().toLowerCase().replace(/^@/, '');
    if (!d || !form) return;
    if (!form.allowedDomains.includes(d)) {
      patch({ allowedDomains: [...form.allowedDomains, d] });
    }
    setDomainInput('');
  }

  function removeDomain(d: string) {
    if (!form) return;
    patch({ allowedDomains: form.allowedDomains.filter((x) => x !== d) });
  }

  async function purgeEmailLogs() {
    setPurging(true);
    try {
      await http.delete('/api/email-logs?olderThanDays=30');
      notify({ type: 'success', message: 'Email logs older than 30 days purged.' });
    } catch {
      notify({ type: 'error', message: 'Failed to purge email logs.' });
    } finally {
      setPurging(false);
    }
  }

  async function purgeSyncLogs() {
    setPurging(true);
    try {
      await http.delete('/api/sync-logs?olderThanDays=30');
      notify({ type: 'success', message: 'Sync logs older than 30 days purged.' });
    } catch {
      notify({ type: 'error', message: 'Failed to purge sync logs.' });
    } finally {
      setPurging(false);
    }
  }

  if (isLoading || !form) {
    return (
      <AdminLayout title="Settings">
        <Center py={80}><Loader size="sm" /></Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: `${rem(28)} ${rem(32)}` }}>
        {/* Header */}
        <Group position="apart" mb="xl" align="flex-end">
          <Box>
            <Title order={3} sx={{ fontWeight: 700, color: '#1a1b1e' }}>Settings</Title>
            <Text size="sm" color="dimmed" mt={4}>Manage platform configuration and preferences</Text>
          </Box>
          <Button
            leftIcon={<IconCheck size={15} />}
            onClick={save}
            loading={mutation.isLoading}
            size="sm"
          >
            Save changes
          </Button>
        </Group>

        <Group align="flex-start" spacing="xl" noWrap>
          {/* Sidebar nav */}
          <Box className={classes.sidebar}>
            <Paper withBorder radius="md" p="xs">
              {NAV.map(({ id, label, icon: Icon }) => (
                <Box
                  key={id}
                  className={cx(classes.sideItem, { [classes.sideItemActive]: active === id })}
                  onClick={() => setActive(id)}
                >
                  <Icon size={16} stroke={1.8} />
                  <Text size="sm">{label}</Text>
                  {id === 'danger' && (
                    <Box sx={{ marginLeft: 'auto' }}>
                      <Badge color="red" variant="filled" size="xs">!</Badge>
                    </Box>
                  )}
                </Box>
              ))}
            </Paper>
          </Box>

          {/* Content */}
          <Paper withBorder radius="md" sx={{ flex: 1, overflow: 'hidden' }}>

            {/* ── General ────────────────────────────────────── */}
            {active === 'general' && (
              <Box>
                <Box className={classes.section}>
                  <Text className={classes.sectionTitle}>General</Text>
                  <Text className={classes.sectionDesc}>Basic platform identity and behaviour.</Text>
                  <FieldRow label="Platform name" hint="Shown in emails and the learner portal.">
                    <TextInput
                      value={form.platformName}
                      onChange={(e) => patch({ platformName: e.currentTarget.value })}
                      placeholder="LMS Platform"
                    />
                  </FieldRow>
                  <FieldRow label="Support email" hint="Learners see this address for help requests.">
                    <TextInput
                      value={form.supportEmail}
                      onChange={(e) => patch({ supportEmail: e.currentTarget.value })}
                      placeholder="support@yourcompany.com"
                    />
                  </FieldRow>
                  <FieldRow label="Timezone" hint="Default timezone for scheduling and display.">
                    <Select
                      value={form.timezone}
                      onChange={(v) => patch({ timezone: v ?? 'UTC' })}
                      data={TIMEZONES}
                      searchable
                    />
                  </FieldRow>
                </Box>

                <Box className={classes.section}>
                  <Text className={classes.sectionTitle}>Maintenance mode</Text>
                  <Text className={classes.sectionDesc}>When enabled, learners see a maintenance banner instead of the platform.</Text>
                  <FieldRow label="Enable maintenance mode" hint="Learners will be blocked from accessing the platform.">
                    <Switch
                      checked={form.maintenanceMode}
                      onChange={(e) => patch({ maintenanceMode: e.currentTarget.checked })}
                      color="red"
                    />
                  </FieldRow>
                  {form.maintenanceMode && (
                    <FieldRow label="Maintenance message" hint="Message shown to learners during maintenance.">
                      <Textarea
                        value={form.maintenanceMessage}
                        onChange={(e) => patch({ maintenanceMessage: e.currentTarget.value })}
                        minRows={2}
                        autosize
                      />
                    </FieldRow>
                  )}
                </Box>
              </Box>
            )}

            {/* ── Enrollment ─────────────────────────────────── */}
            {active === 'enrollment' && (
              <Box className={classes.section}>
                <Text className={classes.sectionTitle}>Enrollment</Text>
                <Text className={classes.sectionDesc}>Control how learners join courses and batches.</Text>
                <FieldRow label="Self-enrollment" hint="Allow learners to enroll themselves into open courses.">
                  <Switch
                    checked={form.selfEnrollment}
                    onChange={(e) => patch({ selfEnrollment: e.currentTarget.checked })}
                  />
                </FieldRow>
                <FieldRow label="Default batch capacity" hint="Maximum learners per batch when no limit is set.">
                  <NumberInput
                    value={form.defaultBatchCapacity}
                    onChange={(v) => patch({ defaultBatchCapacity: typeof v === 'number' ? v : 30 })}
                    min={1}
                    max={1000}
                  />
                </FieldRow>
                <FieldRow label="Enable waitlist" hint="When a batch is full, learners can join a waitlist.">
                  <Switch
                    checked={form.waitlistEnabled}
                    onChange={(e) => patch({ waitlistEnabled: e.currentTarget.checked })}
                  />
                </FieldRow>
              </Box>
            )}

            {/* ── Notifications ──────────────────────────────── */}
            {active === 'notifications' && (
              <Box className={classes.section}>
                <Text className={classes.sectionTitle}>Notifications</Text>
                <Text className={classes.sectionDesc}>Choose which events trigger automated emails.</Text>
                <FieldRow label="Enrollment confirmation" hint="Send email when a learner is enrolled in a course.">
                  <Switch
                    checked={form.notifyOnEnrollment}
                    onChange={(e) => patch({ notifyOnEnrollment: e.currentTarget.checked })}
                  />
                </FieldRow>
                <FieldRow label="Course completion" hint="Send email when a learner completes a course.">
                  <Switch
                    checked={form.notifyOnCompletion}
                    onChange={(e) => patch({ notifyOnCompletion: e.currentTarget.checked })}
                  />
                </FieldRow>
                <FieldRow label="Certificate issued" hint="Send email when a certificate is issued to a learner.">
                  <Switch
                    checked={form.notifyOnCertificate}
                    onChange={(e) => patch({ notifyOnCertificate: e.currentTarget.checked })}
                  />
                </FieldRow>
                <Divider my="md" />
                <FieldRow label="Admin alert email" hint="This address receives alerts for failed syncs and critical events.">
                  <TextInput
                    value={form.adminAlertEmail}
                    onChange={(e) => patch({ adminAlertEmail: e.currentTarget.value })}
                    placeholder="admin@yourcompany.com"
                  />
                </FieldRow>
              </Box>
            )}

            {/* ── Certificates ───────────────────────────────── */}
            {active === 'certificates' && (
              <Box className={classes.section}>
                <Text className={classes.sectionTitle}>Certificates</Text>
                <Text className={classes.sectionDesc}>Configure certificate issuance behaviour.</Text>
                <FieldRow label="Issuer name" hint="Organisation name printed on all certificates.">
                  <TextInput
                    value={form.certificateIssuer}
                    onChange={(e) => patch({ certificateIssuer: e.currentTarget.value })}
                    placeholder="Your Organisation"
                  />
                </FieldRow>
                <FieldRow label="Auto-issue on completion" hint="Automatically issue a certificate when a learner completes a course.">
                  <Switch
                    checked={form.autoIssueCertificate}
                    onChange={(e) => patch({ autoIssueCertificate: e.currentTarget.checked })}
                  />
                </FieldRow>
              </Box>
            )}

            {/* ── Security ───────────────────────────────────── */}
            {active === 'security' && (
              <Box>
                <Box className={classes.section}>
                  <Text className={classes.sectionTitle}>Allowed signup domains</Text>
                  <Text className={classes.sectionDesc}>
                    Restrict new signups to specific email domains. Leave empty to allow all.
                  </Text>

                  <Group spacing="xs" mb="md" noWrap>
                    <TextInput
                      placeholder="company.com"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.currentTarget.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      leftIcon={<IconPlus size={14} />}
                      variant="default"
                      onClick={addDomain}
                      size="sm"
                    >
                      Add
                    </Button>
                  </Group>

                  {form.allowedDomains.length === 0 ? (
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                      No domain restrictions — all email addresses are allowed to sign up.
                    </Alert>
                  ) : (
                    <Stack spacing={6}>
                      {form.allowedDomains.map((d) => (
                        <Group key={d} position="apart" sx={{ background: '#f8f9fa', borderRadius: 8, padding: `${rem(8)} ${rem(12)}` }}>
                          <Group spacing={8}>
                            <IconGlobe size={14} color="#868e96" />
                            <Text size="sm" weight={500}>@{d}</Text>
                          </Group>
                          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => removeDomain(d)}>
                            <IconX size={14} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box className={classes.section}>
                  <Text className={classes.sectionTitle}>Session</Text>
                  <Text className={classes.sectionDesc}>Control how long authenticated sessions remain valid.</Text>
                  <FieldRow label="Session timeout" hint="Minutes of inactivity before a learner is logged out. (1440 = 24 hrs)">
                    <NumberInput
                      value={form.sessionTimeoutMinutes}
                      onChange={(v) => patch({ sessionTimeoutMinutes: typeof v === 'number' ? v : 1440 })}
                      min={15}
                      max={43200}
                      step={15}
                      rightSection={<Text size="xs" color="dimmed" pr={6}>min</Text>}
                    />
                  </FieldRow>
                </Box>
              </Box>
            )}

            {/* ── Danger Zone ────────────────────────────────── */}
            {active === 'danger' && (
              <Box className={classes.section}>
                <Text className={classes.sectionTitle} sx={{ color: '#c92a2a !important' }}>Danger Zone</Text>
                <Text className={classes.sectionDesc}>These actions are irreversible. Proceed with caution.</Text>

                <Stack spacing="md" mt="md">
                  <Box className={classes.dangerZone}>
                    <Group position="apart" noWrap>
                      <Box>
                        <Text size="sm" weight={600} color="red.8">Purge email logs</Text>
                        <Text size="xs" color="dimmed" mt={2}>Delete all email log records older than 30 days.</Text>
                      </Box>
                      <Button
                        color="red"
                        variant="outline"
                        size="sm"
                        leftIcon={<IconTrash size={14} />}
                        loading={purging}
                        onClick={purgeEmailLogs}
                      >
                        Purge
                      </Button>
                    </Group>
                  </Box>

                  <Box className={classes.dangerZone}>
                    <Group position="apart" noWrap>
                      <Box>
                        <Text size="sm" weight={600} color="red.8">Purge sync logs</Text>
                        <Text size="xs" color="dimmed" mt={2}>Delete all Freshworks sync log records older than 30 days.</Text>
                      </Box>
                      <Button
                        color="red"
                        variant="outline"
                        size="sm"
                        leftIcon={<IconTrash size={14} />}
                        loading={purging}
                        onClick={purgeSyncLogs}
                      >
                        Purge
                      </Button>
                    </Group>
                  </Box>

                  <Box className={classes.dangerZone}>
                    <Group position="apart" noWrap>
                      <Box>
                        <Text size="sm" weight={600} color="red.8">Enable maintenance mode</Text>
                        <Text size="xs" color="dimmed" mt={2}>Block all learner access immediately.</Text>
                      </Box>
                      <Switch
                        checked={form.maintenanceMode}
                        onChange={(e) => {
                          patch({ maintenanceMode: e.currentTarget.checked });
                          mutation.mutate({ ...form, maintenanceMode: e.currentTarget.checked });
                        }}
                        color="red"
                      />
                    </Group>
                  </Box>
                </Stack>
              </Box>
            )}
          </Paper>
        </Group>
      </Box>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(context: GetServerSidePropsContext) {
    try {
      await checkAuthorizationForPage(context, 'view:admin_page');
    } catch {
      return { redirect: { destination: '/dashboard', permanent: false } };
    }
    return { props: {} };
  },
});

export default SettingsPage;
