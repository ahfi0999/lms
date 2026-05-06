import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Select,
  Container,
  Title,
  Paper,
  Alert,
  Group,
  Text,
  ActionIcon,
  ThemeIcon,
  Grid,
  Box,
} from '@mantine/core';
import AdminLayout from '../../../layouts/admin-layout';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import { notify } from '../../../lib/notify';
import { useRouter } from 'next/router';
import http from '../../../lib/http-client';
import {
  IconAlertCircle,
  IconUser,
  IconMail,
  IconLock,
  IconShieldCheck,
  IconUserPlus,
  IconInfoCircle,
} from '@tabler/icons-react';
import { GetServerSidePropsContext } from 'next';

interface Props {
  roles: { id: string; name: string }[];
}

export default function CreateUserPage({ roles }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: roles.length > 0 ? roles[0].id : '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await http.post('/api/users/create', form);
      notify({ title: 'Success', message: 'User created successfully', type: 'success' });
      // Reset form
      setForm({
        name: '',
        email: '',
        password: '',
        roleId: roles.length > 0 ? roles[0].id : '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Create User"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Create User', href: '/admin/learners/create-user' },
      ]}
    >
      <Container size="sm" py="xl">
        <Paper
          withBorder
          p={30}
          radius="lg"
          shadow="sm"
          sx={{ borderColor: '#f1f3f5', backgroundColor: '#ffffff' }}
        >
          {/* Header Section */}
          <Group mb={50}>
            <ThemeIcon
              size={64}
              radius="lg"
              variant="light"
              color="blue"
              sx={{ backgroundColor: '#f0f4f8' }}
            >
              <IconUserPlus size={24} color="#339af0" stroke={1.5} />
            </ThemeIcon>
            <div>
              <Title order={3} sx={{ fontWeight: 700, color: '#1c2e46' }} mb={2}>
                Create New User
              </Title>
              <Text color="dimmed" size="xs" weight={500}>
                Fill in the details below to create a new user account.
              </Text>
            </div>
          </Group>

          {error && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              mb="xl"
              variant="light"
              radius="md"
            >
              {error}
            </Alert>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit}>
            <Grid align="center" mb={20}>
              <Grid.Col span={12} sm={4}>
                <Text weight={600} size="sm" color="#1c2e46">
                  Full Name <span style={{ color: 'red' }}>*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={12} sm={8}>
                <TextInput
                  required
                  placeholder="John Doe"
                  icon={<IconUser size="1rem" stroke={1.5} color="#adb5bd" />}
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  radius="md"
                  styles={{
                    input: { borderColor: '#e9ecef', '&:focus': { borderColor: '#339af0' } },
                  }}
                />
              </Grid.Col>
            </Grid>

            <Grid align="center" mb={20}>
              <Grid.Col span={12} sm={4}>
                <Text weight={600} size="sm" color="#1c2e46">
                  Email Address <span style={{ color: 'red' }}>*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={12} sm={8}>
                <TextInput
                  required
                  placeholder="user@example.com"
                  type="email"
                  icon={<IconMail size="1rem" stroke={1.5} color="#adb5bd" />}
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  radius="md"
                  styles={{
                    input: { borderColor: '#e9ecef', '&:focus': { borderColor: '#339af0' } },
                  }}
                />
              </Grid.Col>
            </Grid>

            <Grid align="flex-start" mb={20}>
              <Grid.Col span={12} sm={4} pt="sm">
                <Text weight={600} size="sm" color="#1c2e46">
                  Temporary Password
                </Text>
              </Grid.Col>
              <Grid.Col span={12} sm={8}>
                <PasswordInput
                  required
                  placeholder="Must be at least 8 characters"
                  icon={<IconLock size="1rem" stroke={1.5} color="#adb5bd" />}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  radius="md"
                  styles={{
                    input: { borderColor: '#e9ecef', '&:focus': { borderColor: '#339af0' } },
                    innerInput: { borderColor: 'transparent' },
                  }}
                />
                <Group spacing={6} mt={6}>
                  <IconInfoCircle size="0.9rem" color="#339af0" stroke={1.5} />
                  <Text size="xs" color="dimmed" weight={500}>
                    The user will be required to change this password on first login.
                  </Text>
                </Group>
              </Grid.Col>
            </Grid>

            <Grid align="center" mb={30}>
              <Grid.Col span={12} sm={4}>
                <Text weight={600} size="sm" color="#1c2e46">
                  Assign Role <span style={{ color: 'red' }}>*</span>
                </Text>
              </Grid.Col>
              <Grid.Col span={12} sm={8}>
                <Select
                  required
                  placeholder="Select a role"
                  icon={<IconShieldCheck size="1rem" stroke={1.5} color="#adb5bd" />}
                  data={roles.map((r) => ({ value: r.id, label: r.name }))}
                  value={form.roleId}
                  onChange={(val) => handleChange('roleId', val || '')}
                  radius="md"
                  styles={{
                    input: { borderColor: '#e9ecef', '&:focus': { borderColor: '#339af0' } },
                  }}
                />
              </Grid.Col>
            </Grid>

            <Button
              type="submit"
              loading={loading}
              size="md"
              radius="md"
              fullWidth
              leftIcon={<IconUserPlus size="1.2rem" stroke={1.5} />}
              variant="gradient"
              gradient={{ from: '#3b5bdb', to: '#4c6ef5', deg: 90 }}
              sx={{
                fontWeight: 600,
                fontSize: 15,
                boxShadow: '0 4px 14px 0 rgba(76, 110, 245, 0.39)',
              }}
            >
              Create User
            </Button>
          </form>
        </Paper>
      </Container>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    // You can secure this page using the same permission as import users
    await checkAuthorizationForPage(context, 'create:users');

    try {
      const roles = await authzAdmin.getRoles();
      return {
        props: {
          roles: roles.map((r) => ({ id: r.id, name: r.name })),
        },
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        props: {
          roles: [],
        },
      };
    }
  },
});
