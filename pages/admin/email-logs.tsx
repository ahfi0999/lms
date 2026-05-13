import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Box,
  Button,
  createStyles,
  Group,
  Loader,
  Center,
  Modal,
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
  ActionIcon,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconFilter,
  IconMail,
  IconRefresh,
  IconSearch,
  IconSend,
  IconX,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailLog = {
  id: number;
  to: string;
  subject: string;
  body: string;
  template: string | null;
  sentBy: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  createdAt: string;
};

type LogsResponse = {
  result: string;
  logs: EmailLog[];
  total: number;
  sentCount: number;
  failedCount: number;
  page: number;
  limit: number;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  tableRow: {
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function LogDetailModal({ log, opened, onClose, onResent }: {
  log: EmailLog | null;
  opened: boolean;
  onClose: () => void;
  onResent: () => void;
}) {
  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/api/email-logs/${log!.id}/resend`, {});
      return res.data;
    },
    onSuccess: () => {
      notify({ type: 'success', message: 'Email resent successfully' });
      onResent();
      onClose();
    },
    onError: () => notify({ type: 'error', message: 'Failed to resend email' }),
  });

  if (!log) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group spacing="xs">
          <IconMail size={18} color="#1a73e8" />
          <Text weight={600}>Email Details</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack spacing="sm">
        <Group position="apart">
          <Badge
            color={log.status === 'SENT' ? 'green' : 'red'}
            variant="light"
            size="md"
            leftSection={log.status === 'SENT' ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />}
          >
            {log.status}
          </Badge>
          <Text size="xs" color="dimmed">{formatDate(log.createdAt)}</Text>
        </Group>

        <Box>
          <Text size="xs" color="dimmed" weight={600} mb={2}>TO</Text>
          <Text size="sm">{log.to}</Text>
        </Box>

        <Box>
          <Text size="xs" color="dimmed" weight={600} mb={2}>SUBJECT</Text>
          <Text size="sm" weight={500}>{log.subject}</Text>
        </Box>

        {log.template && (
          <Box>
            <Text size="xs" color="dimmed" weight={600} mb={2}>TEMPLATE</Text>
            <Badge size="sm" variant="outline" color="blue">{log.template}</Badge>
          </Box>
        )}

        <Box>
          <Text size="xs" color="dimmed" weight={600} mb={2}>SENT BY</Text>
          <Text size="sm">{log.sentBy}</Text>
        </Box>

        {log.error && (
          <Box sx={{ backgroundColor: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: 8, padding: 12 }}>
            <Text size="xs" color="red" weight={600} mb={4}>ERROR</Text>
            <Text size="xs" color="red">{log.error}</Text>
          </Box>
        )}

        <Box>
          <Text size="xs" color="dimmed" weight={600} mb={6}>EMAIL BODY</Text>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 14,
              fontSize: 13,
              lineHeight: 1.7,
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'pre-wrap',
              maxHeight: 240,
              overflowY: 'auto',
              color: '#202124',
            }}
          >
            {log.body}
          </Box>
        </Box>
      </Stack>

      <Group position="right" mt="xl">
        <Button variant="subtle" color="gray" onClick={onClose}>Close</Button>
        <Button
          leftIcon={<IconSend size={14} />}
          loading={resendMutation.isLoading}
          onClick={() => resendMutation.mutate()}
          color="blue"
        >
          Resend Email
        </Button>
      </Group>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailLogsPage() {
  const { classes } = useStyles();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [templateFilter, setTemplateFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['email-logs', page, search, statusFilter, templateFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: statusFilter,
        ...(search ? { search } : {}),
        ...(templateFilter ? { template: templateFilter } : {}),
      });
      const res = await http.get<LogsResponse>(`/api/email-logs?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilter = (val: string | null) => {
    setStatusFilter(val ?? 'ALL');
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setTemplateFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter !== 'ALL' || templateFilter;

  return (
    <AdminLayout
      title="Email Logs"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Email Logs', href: '/admin/email-logs' },
      ]}
    >
      {/* Header */}
      <Group position="apart" mb="xl">
        <Box>
          <Title order={3} weight={700}>Email Logs</Title>
          <Text size="sm" color="dimmed" mt={4}>
            A full history of every email sent from the platform.
          </Text>
        </Box>
        <Tooltip label="Refresh">
          <ActionIcon
            size="lg"
            variant="light"
            color="blue"
            loading={isFetching}
            onClick={() => queryClient.invalidateQueries(['email-logs'])}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Stat cards */}
      <Group mb="xl" grow>
        <Box className={classes.statCard}>
          <Text size="xs" color="dimmed" weight={600} mb={4} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Sent
          </Text>
          <Text size="xl" weight={700} color="blue">
            {isLoading ? '—' : data?.sentCount ?? 0}
          </Text>
        </Box>
        <Box className={classes.statCard}>
          <Text size="xs" color="dimmed" weight={600} mb={4} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Failed
          </Text>
          <Text size="xl" weight={700} color="red">
            {isLoading ? '—' : data?.failedCount ?? 0}
          </Text>
        </Box>
        <Box className={classes.statCard}>
          <Text size="xs" color="dimmed" weight={600} mb={4} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Emails
          </Text>
          <Text size="xl" weight={700}>
            {isLoading ? '—' : (data?.sentCount ?? 0) + (data?.failedCount ?? 0)}
          </Text>
        </Box>
        <Box className={classes.statCard}>
          <Text size="xs" color="dimmed" weight={600} mb={4} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Delivery Rate
          </Text>
          <Text size="xl" weight={700} color="green">
            {isLoading || !data ? '—' : (
              (data.sentCount + data.failedCount) === 0 ? '—'
              : `${Math.round((data.sentCount / (data.sentCount + data.failedCount)) * 100)}%`
            )}
          </Text>
        </Box>
      </Group>

      {/* Filters */}
      <Group mb="md" spacing="sm">
        <TextInput
          placeholder="Search by recipient, subject, or sender..."
          icon={<IconSearch size={14} />}
          value={search}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          sx={{ flex: 1 }}
        />
        <Select
          placeholder="All statuses"
          icon={<IconFilter size={14} />}
          value={statusFilter}
          onChange={handleStatusFilter}
          data={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'SENT', label: 'Sent' },
            { value: 'FAILED', label: 'Failed' },
          ]}
          sx={{ width: 160 }}
          clearable={false}
        />
        <Select
          placeholder="All templates"
          value={templateFilter || null}
          onChange={(v) => { setTemplateFilter(v ?? ''); setPage(1); }}
          data={[
            { value: 'Welcome / Account Created', label: 'Welcome' },
            { value: 'Enrollment Confirmation', label: 'Enrollment Confirmation' },
            { value: 'Issue Acknowledged', label: 'Issue Acknowledged' },
          ]}
          sx={{ width: 200 }}
          clearable
        />
        {hasFilters && (
          <Button variant="subtle" color="gray" leftIcon={<IconX size={14} />} onClick={clearFilters}>
            Clear
          </Button>
        )}
      </Group>

      {/* Table */}
      <Box className={classes.tableCard}>
        <ScrollArea>
          <Table highlightOnHover verticalSpacing="sm">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Template</th>
                <th>Sent By</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <Center py="xl"><Loader size="sm" /></Center>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Center py="xl">
                      <Stack align="center" spacing="xs">
                        <IconMail size={36} color="#9aa0a6" />
                        <Text color="dimmed" size="sm">No email logs found</Text>
                        {hasFilters && (
                          <Button size="xs" variant="subtle" onClick={clearFilters}>Clear filters</Button>
                        )}
                      </Stack>
                    </Center>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={classes.tableRow} onClick={() => setSelectedLog(log)}>
                    <td>
                      <Text size="sm" weight={500}>{log.to}</Text>
                    </td>
                    <td>
                      <Text size="sm" lineClamp={1} sx={{ maxWidth: 260 }}>{log.subject}</Text>
                    </td>
                    <td>
                      {log.template ? (
                        <Badge size="sm" variant="outline" color="blue">{log.template}</Badge>
                      ) : (
                        <Text size="xs" color="dimmed">—</Text>
                      )}
                    </td>
                    <td>
                      <Text size="sm" color="dimmed">{log.sentBy}</Text>
                    </td>
                    <td>
                      <Text size="xs" color="dimmed" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </Text>
                    </td>
                    <td>
                      <Badge
                        color={log.status === 'SENT' ? 'green' : 'red'}
                        variant="light"
                        size="sm"
                        leftSection={
                          log.status === 'SENT'
                            ? <IconCheck size={10} />
                            : <IconAlertCircle size={10} />
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group position="apart" px="md" py="sm" sx={{ borderTop: '1px solid #e0e0e0' }}>
            <Text size="xs" color="dimmed">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} emails
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Group>
        )}
      </Box>

      {/* Detail modal */}
      <LogDetailModal
        log={selectedLog}
        opened={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onResent={() => queryClient.invalidateQueries(['email-logs'])}
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
