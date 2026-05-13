import React, { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  createStyles,
  Divider,
  Group,
  Loader,
  Pagination,
  rem,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconDownload,
  IconFilter,
  IconRefresh,
  IconRefreshAlert,
  IconSearch,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncRecord = {
  id: number;
  email: string;
  name: string | null;
  status: 'success' | 'failed';
  error: string | null;
};

type SyncLog = {
  id: number;
  type: string;
  triggeredBy: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  synced: number;
  failed: number;
  duration: number;
  error: string | null;
  createdAt: string;
  records?: SyncRecord[];
};

type LogsResponse = {
  result: string;
  logs: SyncLog[];
  total: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  totalSynced: number;
  totalFailed: number;
  page: number;
  limit: number;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const FW_GREEN = '#25c16f';

const useStyles = createStyles((theme) => ({
  statCard: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: `${rem(16)} ${rem(20)}`,
    flex: 1,
  },
  tableCard: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  expandedRow: {
    backgroundColor: '#f8f9fa',
  },
  recordRow: {
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function StatusBadge({ status }: { status: 'SUCCESS' | 'PARTIAL' | 'FAILED' }) {
  const map = {
    SUCCESS: { color: 'green',  label: 'Success', icon: IconCircleCheck },
    PARTIAL: { color: 'yellow', label: 'Partial', icon: IconAlertCircle },
    FAILED:  { color: 'red',    label: 'Failed',  icon: IconCircleX     },
  };
  const m = map[status];
  return (
    <Badge color={m.color} variant="light" size="sm" leftSection={<m.icon size={11} />}>
      {m.label}
    </Badge>
  );
}

// ─── Expandable Row ───────────────────────────────────────────────────────────

function ExpandedDetail({ logId, onRetry, retrying }: {
  logId: number;
  onRetry: () => void;
  retrying: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['sync-log-detail', logId],
    queryFn: async () => {
      const res = await http.get<{ log: SyncLog }>(`/api/sync-logs/${logId}`);
      return res.data.log;
    },
  });

  if (isLoading) return <Center py="md"><Loader size="sm" /></Center>;
  if (!data) return null;

  const failed  = data.records?.filter((r) => r.status === 'failed')  ?? [];
  const success = data.records?.filter((r) => r.status === 'success') ?? [];

  return (
    <Box p="md">
      <Group mb="md" spacing="xl">
        <Box>
          <Text size="xs" color="dimmed" weight={600}>TRIGGERED BY</Text>
          <Text size="sm">{data.triggeredBy}</Text>
        </Box>
        <Box>
          <Text size="xs" color="dimmed" weight={600}>DURATION</Text>
          <Text size="sm">{formatDuration(data.duration)}</Text>
        </Box>
        <Box>
          <Text size="xs" color="dimmed" weight={600}>SYNCED</Text>
          <Text size="sm" color="green" weight={600}>{data.synced}</Text>
        </Box>
        <Box>
          <Text size="xs" color="dimmed" weight={600}>FAILED</Text>
          <Text size="sm" color={data.failed > 0 ? 'red' : 'dimmed'} weight={600}>{data.failed}</Text>
        </Box>
        {data.error && (
          <Box>
            <Text size="xs" color="dimmed" weight={600}>ERROR</Text>
            <Text size="sm" color="red">{data.error}</Text>
          </Box>
        )}
        {failed.length > 0 && (
          <Button
            size="xs"
            color="orange"
            variant="light"
            leftIcon={retrying ? <Loader size={10} /> : <IconRefreshAlert size={13} />}
            loading={retrying}
            onClick={onRetry}
          >
            Retry {failed.length} Failed
          </Button>
        )}
      </Group>

      {(data.records?.length ?? 0) > 0 && (
        <>
          <Divider mb="sm" label={`${data.records!.length} records`} labelPosition="left" />
          <ScrollArea style={{ maxHeight: 220 }}>
            <Table striped fontSize="xs">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {data.records!.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{r.name ?? '—'}</td>
                    <td>
                      <Badge
                        size="xs"
                        color={r.status === 'success' ? 'green' : 'red'}
                        variant="light"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td>
                      <Text size="xs" color="dimmed">{r.error ?? '—'}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </>
      )}
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SyncLogsPage() {
  const { classes } = useStyles();
  const queryClient = useQueryClient();

  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [typeFilter, setType]     = useState('');
  const [expandedId, setExpanded] = useState<number | null>(null);
  const [retryingId, setRetrying] = useState<number | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sync-logs', page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  '20',
        status: statusFilter,
        ...(search     ? { search }      : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      const res = await http.get<LogsResponse>(`/api/sync-logs?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await http.post(`/api/sync-logs/${id}/retry`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sync-logs']);
      queryClient.invalidateQueries(['sync-log-detail', retryingId]);
      setRetrying(null);
      notify({ type: 'success', message: 'Failed records retried successfully' });
    },
    onError: () => {
      setRetrying(null);
      notify({ type: 'error', message: 'Retry failed' });
    },
  });

  const handleRetry = (id: number) => {
    setRetrying(id);
    retryMutation.mutate(id);
  };

  const handleExport = () => {
    const rows = data?.logs ?? [];
    if (!rows.length) { notify({ type: 'error', message: 'No logs to export' }); return; }
    const headers = ['ID', 'Type', 'Triggered By', 'Status', 'Synced', 'Failed', 'Duration (ms)', 'Date'];
    const csv = [
      headers.join(','),
      ...rows.map((l) =>
        [l.id, l.type, l.triggeredBy, l.status, l.synced, l.failed, l.duration, l.createdAt].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sync-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearch(''); setStatus('ALL'); setType(''); setPage(1); };
  const hasFilters   = search || statusFilter !== 'ALL' || typeFilter;
  const logs         = data?.logs ?? [];
  const totalPages   = Math.ceil((data?.total ?? 0) / 20);

  return (
    <AdminLayout
      title="Sync Logs"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Freshworks CRM', href: '/admin/freshworks-crm' },
        { title: 'Sync Logs', href: '/admin/sync-logs' },
      ]}
    >
      {/* Header */}
      <Group position="apart" mb="xl">
        <Box>
          <Title order={3} weight={700}>Sync Logs</Title>
          <Text size="sm" color="dimmed" mt={4}>
            Full history of every Freshworks CRM sync operation.
          </Text>
        </Box>
        <Group spacing="xs">
          <Tooltip label="Export CSV">
            <ActionIcon size="lg" variant="light" color="blue" onClick={handleExport}>
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh">
            <ActionIcon
              size="lg" variant="light" color="blue" loading={isFetching}
              onClick={() => queryClient.invalidateQueries(['sync-logs'])}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Stat cards */}
      <Group mb="xl" grow>
        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconCircleCheck size={16} color="green" />
            <Text size="xs" color="dimmed" weight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Success</Text>
          </Group>
          <Text size="xl" weight={700} color="green">{isLoading ? '—' : data?.successCount ?? 0}</Text>
          <Text size="xs" color="dimmed" mt={2}>sync operations</Text>
        </Box>
        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconAlertCircle size={16} color="orange" />
            <Text size="xs" color="dimmed" weight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Partial</Text>
          </Group>
          <Text size="xl" weight={700} color="orange">{isLoading ? '—' : data?.partialCount ?? 0}</Text>
          <Text size="xs" color="dimmed" mt={2}>sync operations</Text>
        </Box>
        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconCircleX size={16} color="red" />
            <Text size="xs" color="dimmed" weight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failed</Text>
          </Group>
          <Text size="xl" weight={700} color="red">{isLoading ? '—' : data?.failedCount ?? 0}</Text>
          <Text size="xs" color="dimmed" mt={2}>sync operations</Text>
        </Box>
        <Box className={classes.statCard}>
          <Group spacing="xs" mb={6}>
            <IconUsers size={16} color={FW_GREEN} />
            <Text size="xs" color="dimmed" weight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Records</Text>
          </Group>
          <Text size="xl" weight={700}>{isLoading ? '—' : data?.totalSynced ?? 0}</Text>
          <Text size="xs" color="dimmed" mt={2}>learners synced all time</Text>
        </Box>
      </Group>

      {/* Filters */}
      <Group mb="md" spacing="sm">
        <TextInput
          placeholder="Search by type or triggered by..."
          icon={<IconSearch size={14} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          sx={{ flex: 1 }}
        />
        <Select
          placeholder="All statuses"
          icon={<IconFilter size={14} />}
          value={statusFilter}
          onChange={(v) => { setStatus(v ?? 'ALL'); setPage(1); }}
          clearable={false}
          data={[
            { value: 'ALL',     label: 'All Statuses' },
            { value: 'SUCCESS', label: 'Success' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'FAILED',  label: 'Failed' },
          ]}
          sx={{ width: 160 }}
        />
        <Select
          placeholder="All types"
          value={typeFilter || null}
          onChange={(v) => { setType(v ?? ''); setPage(1); }}
          clearable
          data={[
            { value: 'Full Sync',       label: 'Full Sync' },
            { value: 'Enrollment Sync', label: 'Enrollment Sync' },
            { value: 'Profile Update',  label: 'Profile Update' },
          ]}
          sx={{ width: 180 }}
        />
        {hasFilters && (
          <Button variant="subtle" color="gray" leftIcon={<IconX size={14} />} onClick={clearFilters}>
            Clear
          </Button>
        )}
      </Group>

      {/* Table */}
      <Box className={classes.tableCard}>
        <Table highlightOnHover verticalSpacing="sm">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Type</th>
              <th>Triggered By</th>
              <th>Synced</th>
              <th>Failed</th>
              <th>Duration</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8}><Center py="xl"><Loader size="sm" /></Center></td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <Center py="xl">
                    <Stack align="center" spacing="xs">
                      <IconRefreshAlert size={36} color="#9aa0a6" />
                      <Text color="dimmed" size="sm">No sync logs found</Text>
                      {hasFilters && (
                        <Button size="xs" variant="subtle" onClick={clearFilters}>Clear filters</Button>
                      )}
                    </Stack>
                  </Center>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expandedId === log.id ? null : log.id)}
                  >
                    <td>
                      <ActionIcon size="xs" variant="transparent" color="gray">
                        {expandedId === log.id
                          ? <IconChevronDown size={14} />
                          : <IconChevronRight size={14} />}
                      </ActionIcon>
                    </td>
                    <td><Text size="sm" weight={500}>{log.type}</Text></td>
                    <td><Text size="sm" color="dimmed">{log.triggeredBy}</Text></td>
                    <td><Text size="sm" color="green" weight={600}>{log.synced}</Text></td>
                    <td>
                      <Text size="sm" color={log.failed > 0 ? 'red' : 'dimmed'} weight={log.failed > 0 ? 600 : 400}>
                        {log.failed}
                      </Text>
                    </td>
                    <td>
                      <Group spacing={4}>
                        <IconClock size={12} color="#9aa0a6" />
                        <Text size="xs" color="dimmed">{formatDuration(log.duration)}</Text>
                      </Group>
                    </td>
                    <td><Text size="xs" color="dimmed">{formatDate(log.createdAt)}</Text></td>
                    <td><StatusBadge status={log.status} /></td>
                  </tr>

                  {expandedId === log.id && (
                    <tr className={classes.expandedRow}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <ExpandedDetail
                          logId={log.id}
                          onRetry={() => handleRetry(log.id)}
                          retrying={retryingId === log.id && retryMutation.isLoading}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>

        {totalPages > 1 && (
          <Group position="apart" px="md" py="sm" sx={{ borderTop: '1px solid #e0e0e0' }}>
            <Text size="xs" color="dimmed">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data?.total ?? 0)} of {data?.total ?? 0} logs
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        )}
      </Box>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: any) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');
    return { props: {} };
  },
});
