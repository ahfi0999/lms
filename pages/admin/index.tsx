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
  SimpleGrid,
  Paper,
  Text,
  Group,
  Title,
  Table,
  Badge,
  Card,
  Stack,
  Progress,
  Button,
  TextInput,
} from '@mantine/core';
import {
  IconUsers,
  IconBook,
  IconAlertTriangle,
  IconLock,
  IconLockOpen,
  IconSearch,
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

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group position="apart">
        <Text size="xs" color="dimmed" transform="uppercase" weight={700}>
          {title}
        </Text>
        <Icon size={22} color={color} stroke={1.5} />
      </Group>

      <Group align="flex-end" spacing="xs" mt={25}>
        <Text size="3xl" weight={700} sx={{ lineHeight: 1 }}>
          {value}
        </Text>
      </Group>
    </Paper>
  );
}

export default function AdminPage(props: AdminPageProps) {
  const { totalCourses, totalLearners, expiringUsers } = props;
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = expiringUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBlockStatus = async (userId: string, currentlyBlocked: boolean) => {
    setLoadingActionId(userId);
    try {
      await http.post('/api/users/block', { userId, blocked: !currentlyBlocked });
      notify({
        title: 'Success',
        message: `User has been ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully.`,
        type: 'success',
      });
      router.replace(router.asPath); // Refresh the server-side props
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

  return (
    <AdminLayout title="Admin Dashboard" breadcrumbs={[{ title: 'Admin', href: '/admin' }]}>
      <Stack spacing="xl">
        <Title order={2}>Dashboard Overview</Title>
        <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
          <StatCard title="Total Courses" value={totalCourses} icon={IconBook} color="#228be6" />
          <StatCard title="Total Learners" value={totalLearners} icon={IconUsers} color="#12b886" />
          <StatCard
            title="Expiring Soon"
            value={expiringUsers.filter((u) => u.daysRemaining <= 30 && !u.isExpired).length}
            icon={IconAlertTriangle}
            color="#f59f00"
          />
        </SimpleGrid>

        <Card withBorder radius="md" p="md">
          <Group position="apart" mb="md">
            <Title order={3} size="h4">
              Learners Expiring Soon (1 Year Rule)
            </Title>
            <Badge color="orange" variant="light">
              Needs attention
            </Badge>
          </Group>
          <Text color="dimmed" size="sm" mb="md">
            The following users were created almost a year ago. Based on the 1-year expiration rule,
            their access to Auth0 should be reviewed or blocked.
          </Text>

          <TextInput
            placeholder="Search by email or name..."
            icon={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            mb="md"
            sx={{ maxWidth: 400 }}
          />

          <Table verticalSpacing="sm" striped highlightOnHover>
            <thead>
              <tr>
                <th>Email</th>
                <th>Courses Selected</th>
                <th>Joined Date</th>
                <th>Expiration Date</th>
                <th>Status</th>
                <th>Auth0 Action Taken</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Text size="sm" weight={500}>
                        {user.email}
                      </Text>
                    </td>
                    <td>
                      {user.enrolledCourses.length > 0 ? (
                        <Group spacing="xs">
                          {user.enrolledCourses.map((course) => (
                            <Badge key={course} size="xs" variant="outline" color="blue">
                              {course}
                            </Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="xs" color="dimmed">
                          No courses
                        </Text>
                      )}
                    </td>
                    <td>{user.createdAt}</td>
                    <td>{user.expirationDate}</td>
                    <td>
                      {user.isExpired ? (
                        <Badge color="red" variant="filled">
                          Expired ({Math.abs(user.daysRemaining)} days ago)
                        </Badge>
                      ) : (
                        <Badge color={user.daysRemaining <= 30 ? 'orange' : 'blue'} variant="light">
                          {user.daysRemaining} days remaining
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Group spacing="xs">
                        {user.isBlocked ? (
                          <Badge color="red" variant="filled">
                            Blocked
                          </Badge>
                        ) : (
                          <Badge color="green" variant="light">
                            Active
                          </Badge>
                        )}
                        <Button
                          size="xs"
                          variant={user.isBlocked ? 'light' : 'outline'}
                          color={user.isBlocked ? 'blue' : 'red'}
                          leftIcon={
                            user.isBlocked ? <IconLockOpen size={14} /> : <IconLock size={14} />
                          }
                          loading={loadingActionId === user.id}
                          onClick={() => confirmToggleBlock(user)}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      </Group>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <Text color="dimmed" align="center" py="md">
                      No users found.
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </Stack>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');

    const totalCourses = await db.course.count({ where: { archived: false } });
    const totalLearners = await db.user.count();

    // Fetch all courses to map enrollments
    const allCourses = await db.course.findMany({ select: { title: true, users: true } });

    let auth0Users: any[] = [];
    let adminUserIds = new Set<string>();

    try {
      // Fetch all roles to find the Admin role
      const roles = await authzAdmin.getRoles();
      const adminRole = roles.find(
        (r: any) => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator'
      );

      if (adminRole && adminRole.id) {
        // Fetch all users who have the Admin role
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
      // Filter out any user that has the Admin role
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
          // Format the dates on the server to prevent React hydration errors
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

    // Sort by days remaining (lowest first, meaning closest to expire or most expired)
    usersWithExpiration.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      props: {
        totalCourses,
        totalLearners,
        expiringUsers: usersWithExpiration.slice(0, 10), // Show top 10
      },
    };
  },
});
