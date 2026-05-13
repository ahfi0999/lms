import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  createStyles,
  Divider,
  Group,
  Loader,
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
  ThemeIcon,
  Collapse,
} from '@mantine/core';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconKey,
  IconRefresh,
  IconSearch,
  IconShield,
  IconShieldCheck,
  IconUserCheck,
  IconUserCircle,
  IconUserPlus,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import AdminLayout from '../../layouts/admin-layout';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleData = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
};

type UserRole = { roleId: string; roleName: string } | null;

type UserData = {
  id: string;
  name: string;
  email: string;
  picture: string;
  lastLogin: string;
  blocked: boolean;
  emailVerified: boolean;
  createdAt: string;
  role: UserRole;
};

type ListResponse = {
  users: UserData[];
  total: number;
  roles: { id: string; name: string }[];
};

// ─── Permission label map ──────────────────────────────────────────────────────

const PERM_LABELS: Record<string, string> = {
  'read:users':        'View Users',
  'create:users':      'Create Users',
  'update:users':      'Edit Users',
  'write:project_files': 'Upload Project Files',
  'read:project_files':  'View Project Files',
  'write:resources':   'Upload Resources',
  'read:resources':    'View Resources',
  'view:admin_page':   'Access Admin Panel',
  'read:courses':      'View Courses',
  'read:mycourses':    'View My Courses',
  'create:courses':    'Create Courses',
  'update:courses':    'Edit Courses',
  'utils:upload_files':'Upload Files',
  'admin:dashboards':  'Admin Dashboards',
  'read:app_events':   'View Audit Events',
};

const ROLE_COLORS: Record<string, string> = {
  admin:   'violet',
  learner: 'blue',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createStyles((theme) => ({
  roleCard: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: rem(16),
    flex: 1,
    minWidth: 240,
  },
  tableCard: {
    backgroundColor: 'white',
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  permBadge: {
    fontSize: rem(11),
    fontWeight: 500,
  },
}));

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({ role }: { role: RoleData }) {
  const { classes } = useStyles();
  const [expanded, setExpanded] = useState(false);
  const color = ROLE_COLORS[role.name?.toLowerCase()] ?? 'gray';

  return (
    <Box className={classes.roleCard}>
      <Group position="apart" mb="xs">
        <Group spacing="xs">
          <ThemeIcon color={color} variant="light" size="md" radius="md">
            <IconShield size={16} />
          </ThemeIcon>
          <Text weight={700} size="sm" sx={{ textTransform: 'capitalize' }}>{role.name}</Text>
        </Group>
        <Badge color={color} variant="light" size="sm">{role.userCount} users</Badge>
      </Group>

      {role.description && (
        <Text size="xs" color="dimmed" mb="sm">{role.description}</Text>
      )}

      <Group spacing={4} mb="xs">
        {role.permissions.slice(0, expanded ? undefined : 4).map((p) => (
          <Badge key={p} size="xs" variant="outline" color={color} className={classes.permBadge}>
            {PERM_LABELS[p] ?? p}
          </Badge>
        ))}
        {!expanded && role.permissions.length > 4 && (
          <Badge
            size="xs"
            variant="filled"
            color="gray"
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(true)}
          >
            +{role.permissions.length - 4} more
          </Badge>
        )}
      </Group>

      {expanded && (
        <Text
          size="xs"
          color="blue"
          sx={{ cursor: 'pointer' }}
          onClick={() => setExpanded(false)}
        >
          Show less
        </Text>
      )}

      <Divider mt="xs" mb="xs" />
      <Text size="xs" color="dimmed">
        <IconKey size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
      </Text>
    </Box>
  );
}

// ─── Assign Role Modal ────────────────────────────────────────────────────────

function AssignRoleModal({
  user,
  roles,
  opened,
  onClose,
  onSaved,
}: {
  user: UserData | null;
  roles: { id: string; name: string }[];
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    user?.role?.roleId ?? null
  );

  const mutation = useMutation({
    mutationFn: async () => {
      await http.post('/api/users/assign-role', {
        userId: user!.id,
        roleId: selectedRoleId,
      });
    },
    onSuccess: () => {
      notify({ type: 'success', message: `Role updated for ${user?.name}` });
      onSaved();
      onClose();
    },
    onError: () => notify({ type: 'error', message: 'Failed to update role' }),
  });

  if (!user) return null;

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group spacing="xs">
          <IconShieldCheck size={18} color="#7c3aed" />
          <Text weight={600}>Change Role</Text>
        </Group>
      }
      centered
      size="sm"
    >
      <Group mb="lg" spacing="sm">
        <Avatar src={user.picture} size={40} radius="xl" />
        <Box>
          <Text size="sm" weight={600}>{user.name}</Text>
          <Text size="xs" color="dimmed">{user.email}</Text>
        </Box>
      </Group>

      <Text size="xs" color="dimmed" weight={600} mb={6}>CURRENT ROLE</Text>
      <Badge
        color={ROLE_COLORS[user.role?.roleName?.toLowerCase() ?? ''] ?? 'gray'}
        variant="light"
        mb="md"
        size="md"
      >
        {user.role?.roleName ?? 'No role assigned'}
      </Badge>

      <Select
        label="Assign New Role"
        placeholder="Select a role..."
        data={roleOptions}
        value={selectedRoleId}
        onChange={setSelectedRoleId}
        icon={<IconShield size={14} />}
        mb="lg"
      />

      <Group position="right">
        <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
        <Button
          leftIcon={<IconCheck size={14} />}
          loading={mutation.isLoading}
          disabled={!selectedRoleId || selectedRoleId === user.role?.roleId}
          onClick={() => mutation.mutate()}
          color="violet"
        >
          Save Role
        </Button>
      </Group>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersRolesPage() {
  const { classes } = useStyles();
  const queryClient = useQueryClient();

  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]             = useState(0);
  const [selectedUser, setUser]     = useState<UserData | null>(null);
  const [modalOpen, setModal]       = useState(false);

  // Fetch users with roles
  const usersQuery = useQuery({
    queryKey: ['users-with-roles', search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        ...(search     ? { search }          : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      const res = await http.get<ListResponse>(`/api/users/list-with-roles?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Fetch roles detail (for role cards)
  const rolesQuery = useQuery({
    queryKey: ['roles-detail'],
    queryFn: async () => {
      const res = await http.get<{ roles: RoleData[] }>('/api/users/roles');
      return res.data.roles;
    },
    staleTime: 5 * 60 * 1000,
  });

  const users     = usersQuery.data?.users ?? [];
  const allRoles  = usersQuery.data?.roles ?? [];
  const total     = usersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);
  const hasFilters = search || roleFilter;

  const clearFilters = () => { setSearch(''); setRoleFilter(''); setPage(0); };

  const openAssign = (user: UserData) => {
    setUser(user);
    setModal(true);
  };

  const roleFilterOptions = [
    { value: '', label: 'All Roles' },
    ...allRoles.map((r) => ({ value: r.name, label: r.name.charAt(0).toUpperCase() + r.name.slice(1) })),
  ];

  return (
    <AdminLayout
      title="Users & Roles"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Users & Roles', href: '/admin/users-roles' },
      ]}
    >
      {/* Header */}
      <Group position="apart" mb="xl">
        <Box>
          <Title order={3} weight={700}>Users & Roles</Title>
          <Text size="sm" color="dimmed" mt={4}>
            Manage Auth0 roles and permissions for all platform users.
          </Text>
        </Box>
        <Group spacing="xs">
          <Tooltip label="Refresh">
            <ActionIcon
              size="lg" variant="light" color="blue"
              loading={usersQuery.isFetching}
              onClick={() => {
                queryClient.invalidateQueries(['users-with-roles']);
                queryClient.invalidateQueries(['roles-detail']);
              }}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button
            component={Link}
            href="/admin/learners/create-user"
            leftIcon={<IconUserPlus size={16} />}
            color="violet"
          >
            Create User
          </Button>
        </Group>
      </Group>

      {/* Role Cards */}
      <Box mb="xl">
        <Text size="xs" weight={700} color="dimmed" mb="sm" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Roles Overview
        </Text>
        {rolesQuery.isLoading ? (
          <Center py="md"><Loader size="sm" /></Center>
        ) : (
          <Group align="flex-start" grow>
            {(rolesQuery.data ?? []).map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
            {(rolesQuery.data ?? []).length === 0 && (
              <Text size="sm" color="dimmed">No roles found in Auth0.</Text>
            )}
          </Group>
        )}
      </Box>

      {/* Users Table */}
      <Box mb="md">
        <Text size="xs" weight={700} color="dimmed" mb="sm" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          All Users
        </Text>

        <Group mb="md" spacing="sm">
          <TextInput
            placeholder="Search by name or email..."
            icon={<IconSearch size={14} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(0); }}
            sx={{ flex: 1 }}
          />
          <Select
            placeholder="All Roles"
            icon={<IconShield size={14} />}
            value={roleFilter || null}
            onChange={(v) => { setRoleFilter(v ?? ''); setPage(0); }}
            data={roleFilterOptions}
            sx={{ width: 160 }}
            clearable
          />
          {hasFilters && (
            <Button variant="subtle" color="gray" leftIcon={<IconX size={14} />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Group>

        <Box className={classes.tableCard}>
          <Table highlightOnHover verticalSpacing="sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={5}><Center py="xl"><Loader size="sm" /></Center></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Center py="xl">
                      <Stack align="center" spacing="xs">
                        <IconUsers size={36} color="#9aa0a6" />
                        <Text color="dimmed" size="sm">No users found</Text>
                        {hasFilters && (
                          <Button size="xs" variant="subtle" onClick={clearFilters}>Clear filters</Button>
                        )}
                      </Stack>
                    </Center>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleColor = ROLE_COLORS[user.role?.roleName?.toLowerCase() ?? ''] ?? 'gray';
                  return (
                    <tr key={user.id}>
                      <td>
                        <Group spacing="sm" noWrap>
                          <Avatar src={user.picture} size={34} radius="xl" />
                          <Text size="sm" weight={500} lineClamp={1}>{user.name}</Text>
                        </Group>
                      </td>
                      <td>
                        <Text size="sm" color="dimmed">{user.email}</Text>
                      </td>
                      <td>
                        {user.role ? (
                          <Badge
                            color={roleColor}
                            variant="light"
                            size="sm"
                            leftSection={<IconShield size={10} />}
                            sx={{ textTransform: 'capitalize' }}
                          >
                            {user.role.roleName}
                          </Badge>
                        ) : (
                          <Badge color="gray" variant="outline" size="sm">No role</Badge>
                        )}
                      </td>
                      <td>
                        <Text size="xs" color="dimmed">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Never'}
                        </Text>
                      </td>
                      <td>
                        <Group spacing={4}>
                          <Tooltip label="Change Role">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="violet"
                              onClick={() => openAssign(user)}
                            >
                              <IconShieldCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="View Profile">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              component={Link}
                              href={`/admin/learners/manage-user?email=${encodeURIComponent(user.email)}`}
                            >
                              <IconUserCircle size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Group position="apart" px="md" py="sm" sx={{ borderTop: '1px solid #e0e0e0' }}>
              <Text size="xs" color="dimmed">
                Showing {page * 25 + 1}–{Math.min((page + 1) * 25, total)} of {total} users
              </Text>
              <Pagination
                total={totalPages}
                value={page + 1}
                onChange={(p) => setPage(p - 1)}
                size="sm"
              />
            </Group>
          )}
        </Box>
      </Box>

      {/* Assign Role Modal */}
      <AssignRoleModal
        user={selectedUser}
        roles={allRoles}
        opened={modalOpen}
        onClose={() => setModal(false)}
        onSaved={() => {
          queryClient.invalidateQueries(['users-with-roles']);
          queryClient.invalidateQueries(['roles-detail']);
        }}
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
