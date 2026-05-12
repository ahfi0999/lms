import { useState } from 'react';
import { useRouter } from 'next/router';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import AdminLayout from '../../layouts/admin-layout';
import { GetServerSidePropsContext } from 'next';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import db from '../../lib/db';
import authzAdmin from '../../lib/auth0/authzAdmin';
import {
  Text,
  Group,
  Title,
  Badge,
  Box,
  Button,
  TextInput,
  Paper,
  Tabs,
  Avatar,
  ActionIcon,
  Checkbox,
  SimpleGrid,
  Divider,
  createStyles,
  rem,
  Menu,
} from '@mantine/core';
import {
  IconUsers,
  IconAlertTriangle,
  IconLock,
  IconLockOpen,
  IconSearch,
  IconFilter,
  IconDownload,
  IconPlus,
  IconEye,
  IconMail,
  IconDotsVertical,
  IconCalendar,
  IconUserCheck,
  IconUserPlus,
  IconTrendingUp,
  IconTrendingDown,
  IconCertificate,
  IconBook2,
  IconRefreshAlert,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { openConfirmModal } from '@mantine/modals';

type ExpiringUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  expirationDate: string;
  daysRemaining: number;
  isExpired: boolean;
  enrolledCourses: string[];
  isBlocked: boolean;
};

type AdminPageProps = {
  totalCourses: number;
  totalLearners: number;
  expiringUsers: ExpiringUser[];
};

const COURSE_COLORS: Record<string, string> = {
  Python: 'blue',
  'Data Science': 'violet',
  'AI/ML': 'grape',
  'Full Stack': 'teal',
  'Web Development': 'orange',
};

function courseColor(name: string) {
  return COURSE_COLORS[name] || 'blue';
}

const useStyles = createStyles((theme) => ({
  statCard: {
    backgroundColor: theme.white,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    flex: 1,
  },
  statIconBox: {
    width: rem(48),
    height: rem(48),
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontSize: rem(28),
    fontWeight: 700,
    lineHeight: 1,
    color: theme.colors.gray[9],
  },
  statLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray[6],
    fontWeight: 500,
    marginBottom: rem(4),
  },
  statTrend: {
    fontSize: rem(11),
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: rem(2),
    marginTop: rem(4),
  },
  mainPanel: {
    flex: 1,
    minWidth: 0,
  },
  rightPanel: {
    width: rem(300),
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: theme.white,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
  },
  tableRow: {
    '&:hover td': {
      backgroundColor: theme.colors.gray[0],
    },
    '& td': {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.gray[8],
      padding: `${rem(10)} ${rem(16)}`,
      borderBottom: `${rem(1)} solid ${theme.colors.gray[1]}`,
      verticalAlign: 'middle',
    },
    '& th': {
      fontSize: rem(12),
      color: theme.colors.gray[5],
      fontWeight: 600,
      padding: `${rem(10)} ${rem(16)}`,
      backgroundColor: theme.colors.gray[0],
      borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
      textTransform: 'uppercase',
      letterSpacing: rem(0.5),
    },
  },
  tab: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    padding: `${rem(8)} ${rem(14)}`,
    color: theme.colors.gray[6],
    borderBottom: `${rem(2)} solid transparent`,
    '&[data-active]': {
      color: theme.colors.blue[7],
      borderBottomColor: theme.colors.blue[6],
    },
  },
  crm: {
    backgroundColor: theme.white,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  quickActionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rem(6),
    padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
    borderRadius: theme.radius.md,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    backgroundColor: theme.white,
    cursor: 'pointer',
    fontSize: rem(11),
    fontWeight: 500,
    color: theme.colors.gray[7],
    textAlign: 'center',
    lineHeight: 1.3,
    '&:hover': {
      backgroundColor: theme.colors.gray[0],
    },
  },
  activityItem: {
    padding: `${rem(8)} ${theme.spacing.lg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: `${rem(1)} solid ${theme.colors.gray[1]}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
}));

const STAT_CARDS = (totalLearners: number, expiringCount: number) => [
  {
    label: 'Total Learners',
    value: totalLearners,
    suffix: 'learners',
    icon: IconUsers,
    iconBg: '#e3f2fd',
    iconColor: '#1976d2',
    trend: '+9.1%',
    trendLabel: 'vs last 30 days',
    up: true,
  },
  {
    label: 'Active Learners',
    value: Math.round(totalLearners * 0.78),
    icon: IconUserCheck,
    iconBg: '#e8f5e9',
    iconColor: '#388e3c',
    trend: '+8.6%',
    trendLabel: 'vs last 30 days',
    up: true,
  },
  {
    label: 'Enrolled This Week',
    value: 36,
    icon: IconUserPlus,
    iconBg: '#f3e5f5',
    iconColor: '#7b1fa2',
    trend: '+12.5%',
    trendLabel: 'vs last 7 days',
    up: true,
  },
  {
    label: 'Course Completions',
    value: 28,
    icon: IconCircleCheck,
    iconBg: '#e0f2f1',
    iconColor: '#00796b',
    trend: '+14.2%',
    trendLabel: 'vs last 7 days',
    up: true,
  },
  {
    label: 'Certificates Issued',
    value: 24,
    icon: IconCertificate,
    iconBg: '#fff3e0',
    iconColor: '#e65100',
    trend: '+10.3%',
    trendLabel: 'vs last 7 days',
    up: true,
  },
  {
    label: 'Expiring Soon',
    value: expiringCount,
    icon: IconAlertTriangle,
    iconBg: '#fff8e1',
    iconColor: '#f57f17',
    trend: `in next 7 days`,
    trendLabel: '',
    up: false,
  },
];

const QUICK_ACTIONS = [
  { label: 'Add Learner', icon: IconUserPlus, color: '#4fc3f7' },
  { label: 'Enroll Learner', icon: IconBook2, color: '#81c784' },
  { label: 'Email Learners', icon: IconMail, color: '#f48fb1' },
  { label: 'Import Learners', icon: IconDownload, color: '#80cbc4' },
  { label: 'Create Batch', icon: IconUsers, color: '#ce93d8' },
  { label: 'View Reports', icon: IconTrendingUp, color: '#ffcc02' },
];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Active: 'green',
    Inactive: 'gray',
    Completed: 'blue',
    Blocked: 'red',
  };
  return (
    <Badge color={colorMap[status] || 'gray'} variant="light" size="sm" radius="xl">
      {status}
    </Badge>
  );
}

export default function AdminPage(props: AdminPageProps) {
  const { totalCourses, totalLearners, expiringUsers } = props;
  const router = useRouter();
  const { classes, cx } = useStyles();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('all-learners');

  const filteredUsers = expiringUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expiringCount = expiringUsers.filter((u) => u.daysRemaining <= 7 && !u.isExpired).length;
  const statCards = STAT_CARDS(totalLearners, expiringCount);

  const toggleBlockStatus = async (userId: string, currentlyBlocked: boolean) => {
    setLoadingActionId(userId);
    try {
      await http.post('/api/users/block', { userId, blocked: !currentlyBlocked });
      notify({
        title: 'Success',
        message: `User has been ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully.`,
        type: 'success',
      });
      router.replace(router.asPath);
    } catch (err: any) {
      notify({
        title: 'Error',
        message: err?.response?.data?.message || 'Failed to update user status.',
        type: 'error',
      });
    } finally {
      setLoadingActionId(null);
    }
  };

  const confirmToggleBlock = (user: ExpiringUser) => {
    openConfirmModal({
      title: user.isBlocked ? 'Unblock User' : 'Block User',
      children: (
        <Text size="sm">
          Are you sure you want to {user.isBlocked ? 'unblock' : 'block'}{' '}
          <strong>{user.email}</strong>?
          {user.isBlocked
            ? ' They will regain access to the LMS.'
            : ' They will immediately lose access to the LMS and will not be able to log in.'}
        </Text>
      ),
      labels: { confirm: user.isBlocked ? 'Yes, Unblock' : 'Yes, Block', cancel: 'Cancel' },
      confirmProps: { color: user.isBlocked ? 'blue' : 'red' },
      onConfirm: () => toggleBlockStatus(user.id, user.isBlocked),
    });
  };

  // Derive display rows: use expiringUsers as "all learners" data source
  const displayRows = filteredUsers.slice(0, 5);

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <AdminLayout>
      {/* Welcome bar */}
      <Group position="apart" mb="lg" align="flex-start">
        <Box>
          <Title order={2} size="h3" weight={700}>
            Welcome back, Admin!  
          </Title>
          <Text size="sm" color="dimmed" mt={4}>
            Here&apos;s what&apos;s happening with your learners and courses today.
          </Text>
        </Box>
        <Badge
          leftSection={<IconCalendar size={13} style={{ marginTop: 1 }} />}
          size="lg"
          radius="md"
          variant="outline"
          color="gray"
          styles={{ root: { fontWeight: 500, fontSize: 13, color: '#495057', borderColor: '#dee2e6' } }}
        >
          {dateRange}
        </Badge>
      </Group>

      {/* Stat cards */}
      <Group noWrap spacing="sm" mb="lg" sx={{ overflowX: 'auto', paddingBottom: 2 }}>
        {statCards.map((card) => (
          <Box key={card.label} className={classes.statCard} sx={{ minWidth: rem(160) }}>
            <Box
              className={classes.statIconBox}
              sx={{ backgroundColor: card.iconBg }}
            >
              <card.icon size={22} color={card.iconColor} stroke={1.8} />
            </Box>
            <Box>
              <Text className={classes.statLabel}>{card.label}</Text>
              <Text className={classes.statValue}>{card.value.toLocaleString()}</Text>
              {card.suffix && (
                <Text size={11} color="dimmed">{card.suffix}</Text>
              )}
              <Text
                className={classes.statTrend}
                sx={{ color: card.up ? '#2e7d32' : '#c62828' }}
              >
                {card.up ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
                {card.trend}
                {card.trendLabel && (
                  <Text component="span" sx={{ color: '#868e96', fontWeight: 400 }}>
                    &nbsp;{card.trendLabel}
                  </Text>
                )}
              </Text>
            </Box>
          </Box>
        ))}
      </Group>

      {/* Main two-column layout */}
      <Group align="flex-start" spacing="md" noWrap>
        {/* Left: learners table + bottom sections */}
        <Box className={classes.mainPanel}>
          {/* Learners section */}
          <Box className={classes.sectionCard} mb="md">
            <Box className={classes.sectionHeader}>
              <Group position="apart">
                <Title order={4} weight={600}>Learners</Title>
                <Group spacing="xs">
                  <Button
                    variant="default"
                    size="xs"
                    leftIcon={<IconFilter size={14} />}
                    styles={{ root: { fontWeight: 500 } }}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    leftIcon={<IconDownload size={14} />}
                    styles={{ root: { fontWeight: 500 } }}
                  >
                    Export
                  </Button>
                  <Button
                    size="xs"
                    leftIcon={<IconPlus size={14} />}
                    color="blue"
                  >
                    Add Learner
                  </Button>
                </Group>
              </Group>
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onTabChange={setActiveTab}
              styles={{
                tabsList: {
                  borderBottom: '1px solid #f1f3f5',
                  padding: '0 16px',
                  gap: 4,
                },
                tab: {
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#868e96',
                  borderBottom: '2px solid transparent',
                  paddingTop: 10,
                  paddingBottom: 10,
                  '&[data-active]': {
                    color: '#1971c2',
                    borderBottomColor: '#1971c2',
                  },
                },
              }}
            >
              <Tabs.List>
                {['All Learners', 'Active', 'Inactive', 'Completed', 'Expiring Soon', 'Blocked'].map(
                  (t) => (
                    <Tabs.Tab key={t} value={t.toLowerCase().replace(' ', '-')}>
                      {t}
                    </Tabs.Tab>
                  )
                )}
              </Tabs.List>
            </Tabs>

            {/* Search */}
            <Box px="md" py="sm">
              <TextInput
                placeholder="Search by name, email or phone..."
                icon={<IconSearch size={14} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                sx={{ maxWidth: 360 }}
                size="sm"
                styles={{ input: { borderRadius: 8 } }}
              />
            </Box>

            {/* Table */}
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr className={classes.tableRow}>
                    <th style={{ width: 40, paddingLeft: 16 }}>
                      <Checkbox size="xs" />
                    </th>
                    <th>Learner</th>
                    <th>Courses Enrolled</th>
                    <th>Enrollment Date</th>
                    <th>Expiration Date</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length > 0 ? (
                    displayRows.map((user) => (
                      <tr key={user.id} className={classes.tableRow}>
                        <td style={{ paddingLeft: 16 }}>
                          <Checkbox size="xs" />
                        </td>
                        <td>
                          <Group spacing="sm" noWrap>
                            <Avatar
                              size={32}
                              radius="xl"
                              color="blue"
                              src={undefined}
                            >
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </Avatar>
                            <Box>
                              <Text size="sm" weight={500} sx={{ lineHeight: 1.3 }}>
                                {user.name}
                              </Text>
                              <Text size={11} color="dimmed">
                                {user.email}
                              </Text>
                            </Box>
                          </Group>
                        </td>
                        <td>
                          <Group spacing={4} noWrap>
                            {user.enrolledCourses.slice(0, 2).map((c) => (
                              <Badge
                                key={c}
                                size="xs"
                                radius="sm"
                                color={courseColor(c)}
                                variant="light"
                              >
                                {c}
                              </Badge>
                            ))}
                            {user.enrolledCourses.length > 2 && (
                              <Text size={11} color="dimmed">
                                +{user.enrolledCourses.length - 2}
                              </Text>
                            )}
                          </Group>
                        </td>
                        <td>{user.createdAt}</td>
                        <td>{user.expirationDate}</td>
                        <td>
                          <StatusBadge status={user.isBlocked ? 'Blocked' : user.isExpired ? 'Inactive' : 'Active'} />
                        </td>
                        <td>
                          <Text size="sm" color="dimmed">
                            {user.daysRemaining > 0
                              ? `${user.daysRemaining} days left`
                              : `${Math.abs(user.daysRemaining)} days ago`}
                          </Text>
                        </td>
                        <td>
                          <Group spacing={4} noWrap>
                            <ActionIcon size="sm" variant="subtle" color="gray">
                              <IconEye size={15} />
                            </ActionIcon>
                            <ActionIcon size="sm" variant="subtle" color="gray">
                              <IconMail size={15} />
                            </ActionIcon>
                            <Menu withinPortal position="bottom-end">
                              <Menu.Target>
                                <ActionIcon size="sm" variant="subtle" color="gray">
                                  <IconDotsVertical size={15} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  icon={
                                    user.isBlocked ? (
                                      <IconLockOpen size={14} />
                                    ) : (
                                      <IconLock size={14} />
                                    )
                                  }
                                  color={user.isBlocked ? 'blue' : 'red'}
                                  onClick={() => confirmToggleBlock(user)}
                                >
                                  {user.isBlocked ? 'Unblock' : 'Block'}
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px 16px', textAlign: 'center' }}>
                        <Text color="dimmed" size="sm">
                          No learners found.
                        </Text>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>

            {/* Pagination */}
            <Group position="apart" px="md" py="sm" sx={{ borderTop: '1px solid #f1f3f5' }}>
              <Text size="sm" color="dimmed">
                Showing 1 to {displayRows.length} of {filteredUsers.length} learners
              </Text>
              <Group spacing={4}>
                <ActionIcon size="sm" variant="default" radius="md">
                  <IconChevronLeft size={14} />
                </ActionIcon>
                {[1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    size="xs"
                    variant={p === 1 ? 'filled' : 'default'}
                    color="blue"
                    radius="md"
                    sx={{ minWidth: 32, padding: '0 8px' }}
                  >
                    {p}
                  </Button>
                ))}
                <Text size="sm" color="dimmed" mx={4}>
                  ...
                </Text>
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  sx={{ minWidth: 32, padding: '0 8px' }}
                >
                  107
                </Button>
                <ActionIcon size="sm" variant="default" radius="md">
                  <IconChevronRight size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Box>

          {/* Bottom: Recent Enrollments + Expiring Learners */}
          <SimpleGrid cols={2} spacing="md">
            {/* Recent Enrollments */}
            <Box className={classes.sectionCard}>
              <Box className={classes.sectionHeader}>
                <Group position="apart">
                  <Title order={5} weight={600}>Recent Enrollments</Title>
                  <Text
                    size="xs"
                    color="blue"
                    weight={500}
                    sx={{ cursor: 'pointer' }}
                  >
                    View All
                  </Text>
                </Group>
              </Box>
              {expiringUsers.slice(0, 4).map((user, i) => {
                const hoursAgo = [10, 60, 180, 300][i % 4];
                const timeLabel =
                  hoursAgo < 60
                    ? `${hoursAgo} min ago`
                    : `${Math.round(hoursAgo / 60)} hours ago`;
                const course = user.enrolledCourses[0] || 'a course';
                return (
                  <Box key={user.id} className={classes.activityItem}>
                    <Group spacing="sm" noWrap>
                      <Avatar size={28} radius="xl" color="blue">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </Avatar>
                      <Text size="sm">
                        <Text component="span" weight={500}>
                          {user.name}
                        </Text>{' '}
                        <Text component="span" color="dimmed">
                          enrolled in{' '}
                        </Text>
                        <Text component="span" color="blue" weight={500}>
                          {course}
                        </Text>
                      </Text>
                    </Group>
                    <Text size={11} color="dimmed" sx={{ whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {timeLabel}
                    </Text>
                  </Box>
                );
              })}
            </Box>

            {/* Expiring Learners */}
            <Box className={classes.sectionCard}>
              <Box className={classes.sectionHeader}>
                <Group position="apart">
                  <Title order={5} weight={600}>Expiring Learners</Title>
                  <Text
                    size="xs"
                    color="blue"
                    weight={500}
                    sx={{ cursor: 'pointer' }}
                  >
                    View All
                  </Text>
                </Group>
              </Box>
              {expiringUsers
                .filter((u) => !u.isExpired && u.daysRemaining <= 30)
                .slice(0, 4)
                .map((user) => {
                  const daysLeft = user.daysRemaining;
                  const urgentColor =
                    daysLeft <= 3 ? 'red' : daysLeft <= 5 ? 'orange' : 'yellow';
                  return (
                    <Box key={user.id} className={classes.activityItem}>
                      <Box>
                        <Text size="sm" weight={500}>
                          {user.name}
                        </Text>
                        <Text size={11} color="dimmed">
                          {user.enrolledCourses[0] || 'No course'}
                        </Text>
                      </Box>
                      <Group spacing={6} noWrap>
                        <Text size="sm" color="dimmed">
                          {user.expirationDate}
                        </Text>
                        <Badge size="xs" color={urgentColor} variant="light" radius="xl">
                          {daysLeft} days left
                        </Badge>
                      </Group>
                    </Box>
                  );
                })}
              {expiringUsers.filter((u) => !u.isExpired && u.daysRemaining <= 30).length ===
                0 && (
                <Box p="md">
                  <Text size="sm" color="dimmed" align="center">
                    No learners expiring soon.
                  </Text>
                </Box>
              )}
            </Box>
          </SimpleGrid>
        </Box>

        {/* Right panel */}
        <Box className={classes.rightPanel}>
          {/* Freshworks CRM */}
          <Box className={classes.crm}>
            <Group position="apart" mb="sm">
              <Text size="sm" weight={600}>
                Freshworks CRM Integration
              </Text>
              <Badge color="green" variant="filled" size="sm" radius="xl">
                Connected
              </Badge>
            </Group>
            <Divider mb="sm" />
            <Group position="apart" mb={6}>
              <Text size="xs" color="dimmed">Last Sync</Text>
              <Text size="xs" weight={500}>2 mins ago</Text>
            </Group>
            <Group position="apart" mb={6}>
              <Text size="xs" color="dimmed">Auto Sync</Text>
              <Text size="xs" weight={500} color="green">Enabled</Text>
            </Group>
            <Group position="apart" mb="md">
              <Text size="xs" color="dimmed">Total Synced Learners</Text>
              <Text size="xs" weight={500}>482</Text>
            </Group>
            <Group spacing="xs">
              <Button
                size="xs"
                leftIcon={<IconRefreshAlert size={13} />}
                sx={{ flex: 1 }}
              >
                Sync Now
              </Button>
              <Button
                size="xs"
                variant="default"
                leftIcon={<IconPlayerPlay size={13} />}
                sx={{ flex: 1 }}
              >
                View in Freshworks
              </Button>
            </Group>
          </Box>

          {/* Quick Actions */}
          <Box className={classes.crm}>
            <Text size="sm" weight={600} mb="sm">Quick Actions</Text>
            <SimpleGrid cols={3} spacing="xs">
              {QUICK_ACTIONS.map((action) => (
                <Box key={action.label} className={classes.quickActionBtn}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: `${action.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <action.icon size={18} color={action.color} stroke={1.8} />
                  </Box>
                  <Text sx={{ fontSize: 11, fontWeight: 500, color: '#495057', lineHeight: 1.3 }}>
                    {action.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Group>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');

    const totalCourses = await db.course.count({ where: { archived: false } });
    const totalLearners = await db.user.count();

    const allCourses = await db.course.findMany({ select: { title: true, users: true } });

    let auth0Users: any[] = [];
    let adminUserIds = new Set<string>();

    try {
      const roles = await authzAdmin.getRoles();
      const adminRole = roles.find(
        (r: any) => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator'
      );

      if (adminRole && adminRole.id) {
        const admins = await authzAdmin.getUsersInRole({ id: adminRole.id });
        admins.forEach((admin: any) => {
          if (admin.user_id) adminUserIds.add(admin.user_id);
        });
      }

      // @ts-ignore
      auth0Users = await authzAdmin.getUsers({
        sort: 'created_at:1',
        per_page: 50,
      });
    } catch (e) {
      console.error('Error fetching auth0 users or roles:', e);
    }

    const now = new Date();

    const usersWithExpiration: ExpiringUser[] = auth0Users
      .filter((u: any) => !adminUserIds.has(u.user_id))
      .map((u: any) => {
        const createdAt = new Date(u.created_at);
        const expirationDate = new Date(createdAt);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        const diffTime = expirationDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const enrolledCourses = allCourses
          .filter((c) => c.users.includes(u.user_id))
          .map((c) => c.title);

        return {
          id: u.user_id,
          name: u.name || 'Unknown',
          email: u.email || 'N/A',
          createdAt: createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          expirationDate: expirationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          daysRemaining,
          isExpired: daysRemaining <= 0,
          enrolledCourses,
          isBlocked: !!u.blocked,
        };
      });

    usersWithExpiration.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      props: {
        totalCourses,
        totalLearners,
        expiringUsers: usersWithExpiration.slice(0, 10),
      },
    };
  },
});
