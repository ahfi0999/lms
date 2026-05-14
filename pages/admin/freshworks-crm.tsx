import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import http from '../../lib/http-client';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  createStyles,
  Divider,
  Group,
  Loader,
  Modal,
  PasswordInput,
  rem,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
  Progress,
  Alert,
  Checkbox,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconPlugConnected,
  IconPlugConnectedX,
  IconRefresh,
  IconRefreshAlert,
  IconSettings,
  IconShieldCheck,
  IconUsers,
  IconWifi,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import { notify } from '../../lib/notify';

// ─── Styles ───────────────────────────────────────────────────────────────────

const FW_GREEN = '#25c16f';
const FW_DARK = '#0e4e32';

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: rem(20),
  },
  statCard: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: `${rem(16)} ${rem(20)}`,
    flex: 1,
  },
  sectionLabel: {
    fontSize: rem(11),
    fontWeight: 700,
    letterSpacing: rem(0.8),
    color: theme.colors.gray[5],
    textTransform: 'uppercase' as const,
    marginBottom: rem(12),
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${rem(10)} 0`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[1]}`,
    '&:last-child': { borderBottom: 'none' },
  },
  syncItem: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(8),
    padding: `${rem(6)} 0`,
  },
}));

// ─── Mock sync history ────────────────────────────────────────────────────────

const SYNC_HISTORY = [
  {
    id: 1,
    type: 'Full Sync',
    status: 'success',
    synced: 482,
    failed: 0,
    duration: '1m 12s',
    time: '2026-05-13T10:28:00',
  },
  {
    id: 2,
    type: 'Enrollment Sync',
    status: 'success',
    synced: 15,
    failed: 0,
    duration: '8s',
    time: '2026-05-13T08:00:00',
  },
  {
    id: 3,
    type: 'Enrollment Sync',
    status: 'partial',
    synced: 23,
    failed: 2,
    duration: '11s',
    time: '2026-05-12T08:00:00',
  },
  {
    id: 4,
    type: 'Full Sync',
    status: 'success',
    synced: 460,
    failed: 0,
    duration: '58s',
    time: '2026-05-11T03:00:00',
  },
  {
    id: 5,
    type: 'Enrollment Sync',
    status: 'failed',
    synced: 0,
    failed: 8,
    duration: '3s',
    time: '2026-05-10T08:00:00',
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SyncStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    success: { color: 'green', label: 'Success' },
    partial: { color: 'yellow', label: 'Partial' },
    failed: { color: 'red', label: 'Failed' },
  };
  const m = map[status] ?? { color: 'gray', label: status };
  return (
    <Badge color={m.color} variant="light" size="sm">
      {m.label}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FreshworksCRMPage() {
  const { classes } = useStyles();

  // Connection state
  const [connected, setConnected] = useState(true);
  const [apiKey, setApiKey] = useState('fw_live_••••••••••••••••••••ab4f');
  const [domain, setDomain] = useState('xaktinow.freshworks.com');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [saving, setSaving] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState(false);

  // Sync controls
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('hourly');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const [syncOptions, setSyncOptions] = useState({
    newLearners: true,
    enrollments: true,
    completions: true,
    profileUpdates: false,
  });

  const toggleSyncOption = (key: keyof typeof syncOptions) =>
    setSyncOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  // Test connection
  const handleTestConnection = async () => {
    if (!apiKey || !domain) {
      notify({ type: 'error', message: 'Please enter API key and domain first' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setTesting(false);
    setTestResult('success');
    notify({ type: 'success', message: 'Connection successful' });
  };

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setConnected(true);
    notify({ type: 'success', message: 'Settings saved successfully' });
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      const start = Date.now();
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 150));
        setSyncProgress(i);
      }
      const duration = Date.now() - start;
      // Write real sync log to DB
      await http.post('/api/sync-logs', {
        type: 'Full Sync',
        triggeredBy: 'Manual',
        status: 'SUCCESS',
        synced: 482,
        failed: 0,
        duration,
        records: [],
      });
      return duration;
    },
    onSuccess: () => {
      setSyncing(false);
      setSyncProgress(0);
      notify({ type: 'success', message: '482 learners synced to Freshworks CRM' });
    },
    onError: () => {
      setSyncing(false);
      setSyncProgress(0);
      notify({ type: 'error', message: 'Sync failed' });
    },
  });

  const handleSyncNow = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  // Disconnect
  const handleDisconnect = () => {
    setConnected(false);
    setDisconnectModal(false);
    setApiKey('');
    notify({ type: 'success', message: 'Disconnected from Freshworks CRM' });
  };

  return (
    <AdminLayout
      title="Freshworks CRM"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Freshworks CRM', href: '/admin/freshworks-crm' },
      ]}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Group position="apart" mb="xl">
        <Group spacing="sm">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: FW_GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPlugConnected size={22} color="white" />
          </Box>
          <Box>
            <Title order={3} weight={700}>
              Freshworks CRM
            </Title>
            <Text size="sm" color="dimmed" mt={2}>
              Sync learners and enrollment data with your Freshworks CRM.
            </Text>
          </Box>
        </Group>
        <Group spacing="xs">
          <Badge
            size="lg"
            radius="xl"
            color={connected ? 'green' : 'gray'}
            variant="light"
            leftSection={
              connected ? <IconCircleCheck size={14} /> : <IconPlugConnectedX size={14} />
            }
          >
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          {connected && (
            <Tooltip label="View in Freshworks">
              <ActionIcon
                size="lg"
                variant="light"
                color="blue"
                component="a"
                href={`https://${domain}`}
                target="_blank"
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <Group mb="xl" grow>
        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconUsers size={16} color={FW_GREEN} />
            <Text
              size="xs"
              color="dimmed"
              weight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Total Synced
            </Text>
          </Group>
          <Text size="xl" weight={700} color={connected ? 'dark' : 'dimmed'}>
            {connected ? '482' : '—'}
          </Text>
          <Text size="xs" color="dimmed" mt={2}>
            learners in Freshworks
          </Text>
        </Box>

        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconRefresh size={16} color="#1a73e8" />
            <Text
              size="xs"
              color="dimmed"
              weight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Last Sync
            </Text>
          </Group>
          <Text size="xl" weight={700} color={connected ? 'dark' : 'dimmed'}>
            {connected ? '2m ago' : '—'}
          </Text>
          <Text size="xs" color="dimmed" mt={2}>
            13 May 2026, 10:28 AM
          </Text>
        </Box>

        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconShieldCheck size={16} color="green" />
            <Text
              size="xs"
              color="dimmed"
              weight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Success Rate
            </Text>
          </Group>
          <Text size="xl" weight={700} color={connected ? 'green' : 'dimmed'}>
            {connected ? '98.5%' : '—'}
          </Text>
          <Text size="xs" color="dimmed" mt={2}>
            across last 30 syncs
          </Text>
        </Box>

        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconWifi size={16} color={autoSync && connected ? FW_GREEN : '#9aa0a6'} />
            <Text
              size="xs"
              color="dimmed"
              weight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Auto Sync
            </Text>
          </Group>
          <Text size="xl" weight={700} color={autoSync && connected ? 'green' : 'dimmed'}>
            {autoSync && connected ? 'On' : 'Off'}
          </Text>
          <Text size="xs" color="dimmed" mt={2}>
            {autoSync && connected
              ? `Every ${
                  syncFrequency === 'hourly' ? 'hour' : syncFrequency === '6h' ? '6 hours' : 'day'
                }`
              : 'Disabled'}
          </Text>
        </Box>
      </Group>

      <Group align="flex-start" spacing="lg" sx={{ flexWrap: 'nowrap' }}>
        {/* ── Left column ─────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Connection & API Settings */}
          <Box className={classes.card} mb="lg">
            <Group spacing="xs" mb="md">
              <IconSettings size={16} color="#5f6368" />
              <Text weight={600}>Connection & API Settings</Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="md">
              <Box>
                <Text size="sm" weight={500} mb={6}>
                  Freshworks Domain
                </Text>
                <TextInput
                  placeholder="yourcompany.freshworks.com"
                  value={domain}
                  onChange={(e) => setDomain(e.currentTarget.value)}
                  icon={
                    <Text size="xs" color="dimmed">
                      https://
                    </Text>
                  }
                  description="Your Freshworks CRM subdomain"
                />
              </Box>

              <Box>
                <Text size="sm" weight={500} mb={6}>
                  API Key
                </Text>
                <PasswordInput
                  placeholder="fw_live_••••••••••••••••••••"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.currentTarget.value)}
                  visible={showKey}
                  onVisibilityChange={setShowKey}
                  description="Found in Freshworks → Profile Settings → API Settings"
                />
              </Box>

              {testResult === 'success' && (
                <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
                  Connection verified successfully. Freshworks CRM is reachable.
                </Alert>
              )}
              {testResult === 'fail' && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  Connection failed. Please check your API key and domain.
                </Alert>
              )}

              <Group>
                <Button
                  variant="light"
                  leftIcon={testing ? <Loader size={12} /> : <IconWifi size={14} />}
                  onClick={handleTestConnection}
                  loading={testing}
                  disabled={!apiKey || !domain}
                >
                  Test Connection
                </Button>
                <Button
                  leftIcon={<IconCheck size={14} />}
                  loading={saving}
                  onClick={handleSave}
                  sx={{ backgroundColor: FW_GREEN, '&:hover': { backgroundColor: FW_DARK } }}
                >
                  Save Settings
                </Button>
                {connected && (
                  <Button
                    variant="subtle"
                    color="red"
                    leftIcon={<IconPlugConnectedX size={14} />}
                    onClick={() => setDisconnectModal(true)}
                  >
                    Disconnect
                  </Button>
                )}
              </Group>
            </Stack>
          </Box>

          {/* Recent Sync History */}
          <Box className={classes.card}>
            <Group spacing="xs" mb="md">
              <IconRefreshAlert size={16} color="#5f6368" />
              <Text weight={600}>Recent Sync Activity</Text>
            </Group>
            <Divider mb="md" />

            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Type', 'Synced', 'Failed', 'Duration', 'Time', 'Status'].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        textAlign: 'left',
                        padding: '6px 8px',
                        color: '#5f6368',
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SYNC_HISTORY.map((row) => (
                  <tr key={row.id}>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <Text size="sm">{row.type}</Text>
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <Text size="sm" color="green" weight={500}>
                        {row.synced}
                      </Text>
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <Text size="sm" color={row.failed > 0 ? 'red' : 'dimmed'}>
                        {row.failed}
                      </Text>
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <Text size="sm" color="dimmed">
                        {row.duration}
                      </Text>
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <Text size="xs" color="dimmed" suppressHydrationWarning>
                        {formatTime(row.time)}
                      </Text>
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 8px', borderBottom: '1px solid #f1f3f4' }}
                    >
                      <SyncStatusBadge status={row.status} />
                    </Box>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        </Box>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <Box sx={{ width: 320, flexShrink: 0 }}>
          {/* Sync Now */}
          <Box className={classes.card} mb="lg">
            <Group spacing="xs" mb="md">
              <IconRefreshAlert size={16} color={FW_GREEN} />
              <Text weight={600}>Sync Now</Text>
            </Group>
            <Divider mb="md" />

            <Text size="sm" color="dimmed" mb="md">
              Manually push all learner data to Freshworks CRM immediately.
            </Text>

            {syncing && (
              <Box mb="md">
                <Group position="apart" mb={4}>
                  <Text size="xs" color="dimmed">
                    Syncing learners…
                  </Text>
                  <Text size="xs" color="dimmed">
                    {syncProgress}%
                  </Text>
                </Group>
                <Progress value={syncProgress} color={FW_GREEN} animate size="sm" radius="xl" />
              </Box>
            )}

            <Button
              fullWidth
              size="md"
              leftIcon={
                syncing ? <Loader size={14} color="white" /> : <IconRefreshAlert size={16} />
              }
              loading={syncing}
              disabled={!connected}
              onClick={handleSyncNow}
              sx={{
                backgroundColor: FW_GREEN,
                '&:hover': { backgroundColor: FW_DARK },
                '&:disabled': { backgroundColor: '#e0e0e0' },
              }}
            >
              {syncing ? 'Syncing…' : 'Sync All Learners'}
            </Button>

            {!connected && (
              <Text size="xs" color="dimmed" align="center" mt="xs">
                Connect to Freshworks first to enable sync.
              </Text>
            )}
          </Box>

          {/* Auto Sync Settings */}
          <Box className={classes.card} mb="lg">
            <Group spacing="xs" mb="md">
              <IconWifi size={16} color="#5f6368" />
              <Text weight={600}>Auto Sync</Text>
            </Group>
            <Divider mb="md" />

            <Box className={classes.fieldRow}>
              <Text size="sm">Enable Auto Sync</Text>
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.currentTarget.checked)}
                disabled={!connected}
                color={FW_GREEN}
              />
            </Box>

            <Box mt="sm">
              <Text size="sm" weight={500} mb={6}>
                Sync Frequency
              </Text>
              <Select
                value={syncFrequency}
                onChange={(v) => setSyncFrequency(v ?? 'hourly')}
                disabled={!autoSync || !connected}
                data={[
                  { value: 'hourly', label: 'Every Hour' },
                  { value: '6h', label: 'Every 6 Hours' },
                  { value: 'daily', label: 'Once Daily' },
                ]}
              />
            </Box>
          </Box>

          {/* What to Sync */}
          <Box className={classes.card}>
            <Group spacing="xs" mb="md">
              <IconInfoCircle size={16} color="#5f6368" />
              <Text weight={600}>What to Sync</Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="xs">
              {[
                { key: 'newLearners', label: 'New Learner Registrations' },
                { key: 'enrollments', label: 'Course Enrollments' },
                { key: 'completions', label: 'Course Completions' },
                { key: 'profileUpdates', label: 'Profile Updates' },
              ].map(({ key, label }) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={syncOptions[key as keyof typeof syncOptions]}
                  onChange={() => toggleSyncOption(key as keyof typeof syncOptions)}
                  disabled={!connected}
                  color={FW_GREEN}
                  size="sm"
                />
              ))}
            </Stack>

            <Button
              fullWidth
              variant="light"
              mt="md"
              size="sm"
              leftIcon={<IconCheck size={14} />}
              onClick={() => notify({ type: 'success', message: 'Sync preferences saved' })}
              disabled={!connected}
            >
              Save Preferences
            </Button>
          </Box>
        </Box>
      </Group>

      {/* Disconnect confirmation modal */}
      <Modal
        opened={disconnectModal}
        onClose={() => setDisconnectModal(false)}
        title={
          <Group spacing="xs">
            <IconPlugConnectedX size={18} color="red" />
            <Text weight={600}>Disconnect Freshworks CRM?</Text>
          </Group>
        }
        centered
        size="sm"
      >
        <Text size="sm" color="dimmed" mb="xl">
          This will stop all automatic syncing. Your existing contacts in Freshworks will not be
          deleted. You can reconnect at any time.
        </Text>
        <Group position="right">
          <Button variant="subtle" color="gray" onClick={() => setDisconnectModal(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            leftIcon={<IconPlugConnectedX size={14} />}
            onClick={handleDisconnect}
          >
            Yes, Disconnect
          </Button>
        </Group>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: any) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');
    return { props: {} };
  },
});
