import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { GetServerSidePropsContext } from 'next';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  createStyles,
  FileInput,
  Group,
  Loader,
  Pagination,
  rem,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBook2,
  IconDownload,
  IconUpload,
  IconUserMinus,
  IconUserPlus,
} from '@tabler/icons-react';
import AdminLayout from '../../layouts/admin-layout';
import BulkEnrollment from '../../components/BulkEnrollment';
import db from '../../lib/db';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { checkAuthorizationForPage } from '../../lib/auth-utils';

type Course = { id: number; title: string; enrolledCount: number };
type Props = { courses: Course[] };
type EnrolledUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
  lastLogin: string;
  emailVerified: boolean;
};
type EnrolledByResponse = { users: EnrolledUser[]; total: number; page: number };

const PAGE_SIZE = 10;

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor: theme.white,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  panel: {
    paddingTop: theme.spacing.lg,
  },
}));

export default function BatchManagementPage({ courses }: Props) {
  const { classes } = useStyles();
  const courseOptions = courses.map((c) => ({ value: String(c.id), label: c.title }));

  // Bulk Enroll
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);

  // User Import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const importMutation = useMutation({
    mutationKey: ['import-users'],
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('csv', csvFile as File);
      const res = await http.post('/api/users/import', formData);
      return res.data;
    },
    onSuccess: () => {
      notify({ type: 'success', message: 'Users imported successfully' });
      setCsvFile(null);
    },
    onError: () => {
      notify({ type: 'error', message: 'Import failed. Please check the file and try again.' });
    },
  });

  // Export
  const [exportCourseId, setExportCourseId] = useState<string | null>(null);

  // Batch Unenroll
  const [unenrollCourseId, setUnenrollCourseId] = useState<string | null>(null);
  const [unenrollPage, setUnenrollPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const enrolledQuery = useQuery({
    queryKey: ['enrolled-by', unenrollCourseId, unenrollPage],
    queryFn: async () => {
      const res = await http.get<EnrolledByResponse>(
        `/api/courses/${unenrollCourseId}/enrolled-by?page=${unenrollPage - 1}`
      );
      return res.data;
    },
    enabled: !!unenrollCourseId,
    keepPreviousData: true,
  });

  const batchUnenrollMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await http.post(`/api/courses/${unenrollCourseId}/batch-unenroll`, { userIds });
      return res.data;
    },
    onSuccess: () => {
      notify({ type: 'success', message: 'Users unenrolled successfully' });
      setSelectedIds([]);
      enrolledQuery.refetch();
    },
    onError: () => {
      notify({ type: 'error', message: 'Failed to unenroll users' });
    },
  });

  const users = enrolledQuery.data?.users ?? [];
  const total = enrolledQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const allOnPageSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));
  const someOnPageSelected = users.some((u) => selectedIds.includes(u.id));

  const toggleUser = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !users.find((u) => u.id === id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...users.map((u) => u.id)])]);
    }
  };

  const handleUnenrollCourseChange = (val: string | null) => {
    setUnenrollCourseId(val);
    setUnenrollPage(1);
    setSelectedIds([]);
  };

  return (
    <AdminLayout
      title="Batch Management"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Batch Management', href: '/admin/batch-management' },
      ]}
    >
      <Group position="apart" mb="xl">
        <Box>
          <Title order={3} weight={700}>Batch Management</Title>
          <Text size="sm" color="dimmed" mt={4}>
            Perform bulk operations on learners and enrollments.
          </Text>
        </Box>
      </Group>

      <Tabs defaultValue="enroll" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="enroll" icon={<IconUserPlus size={14} />}>Bulk Enroll</Tabs.Tab>
          <Tabs.Tab value="import" icon={<IconUpload size={14} />}>User Import</Tabs.Tab>
          <Tabs.Tab value="export" icon={<IconDownload size={14} />}>Export</Tabs.Tab>
          <Tabs.Tab value="unenroll" icon={<IconUserMinus size={14} />}>Batch Unenroll</Tabs.Tab>
        </Tabs.List>

        {/* Bulk Enroll */}
        <Tabs.Panel value="enroll" className={classes.panel}>
          <Box className={classes.card}>
            <Text weight={600} mb="md">Bulk Enroll Learners</Text>
            <Select
              label="Select Course"
              placeholder="Pick a course..."
              data={courseOptions}
              value={enrollCourseId}
              onChange={setEnrollCourseId}
              searchable
              icon={<IconBook2 size={14} />}
              mb="lg"
            />
            {enrollCourseId ? (
              <BulkEnrollment courseId={Number(enrollCourseId)} />
            ) : (
              <Text size="sm" color="dimmed" align="center" py="md">
                Select a course above to start enrolling learners.
              </Text>
            )}
          </Box>
        </Tabs.Panel>

        {/* User Import */}
        <Tabs.Panel value="import" className={classes.panel}>
          <Box className={classes.card}>
            <Text weight={600} mb="xs">Import Users via CSV</Text>
            <Text size="sm" color="dimmed" mb="lg">
              Upload a CSV file to create multiple users at once.
            </Text>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                importMutation.mutate();
              }}
            >
              <Stack>
                <FileInput
                  label="CSV File"
                  accept=".csv"
                  placeholder="Select CSV file"
                  withAsterisk
                  value={csvFile}
                  onChange={setCsvFile}
                  icon={<IconUpload size={14} />}
                  description={
                    <Text size="xs">
                      Download the CSV template from{' '}
                      <a href="/api/users/import-template">here</a>.
                    </Text>
                  }
                />
                <Group>
                  <Button
                    type="submit"
                    loading={importMutation.isLoading}
                    disabled={!csvFile}
                    leftIcon={<IconUpload size={14} />}
                  >
                    {importMutation.isLoading ? 'Uploading...' : 'Upload'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Box>
        </Tabs.Panel>

        {/* Export */}
        <Tabs.Panel value="export" className={classes.panel}>
          <Box className={classes.card}>
            <Text weight={600} mb="xs">Export Enrolled Users</Text>
            <Text size="sm" color="dimmed" mb="lg">
              Download a CSV of all learners enrolled in a course.
            </Text>
            <Select
              label="Select Course"
              placeholder="Pick a course..."
              data={courseOptions}
              value={exportCourseId}
              onChange={setExportCourseId}
              searchable
              icon={<IconBook2 size={14} />}
              mb="lg"
            />
            <Button
              component="a"
              href={exportCourseId ? `/api/courses/${exportCourseId}/export-enrolled-users` : '#'}
              disabled={!exportCourseId}
              leftIcon={<IconDownload size={14} />}
              download
            >
              Download CSV
            </Button>
          </Box>
        </Tabs.Panel>

        {/* Batch Unenroll */}
        <Tabs.Panel value="unenroll" className={classes.panel}>
          <Box className={classes.card}>
            <Text weight={600} mb="xs">Batch Unenroll Learners</Text>
            <Text size="sm" color="dimmed" mb="lg">
              Select learners to remove from a course.
            </Text>
            <Select
              label="Select Course"
              placeholder="Pick a course..."
              data={courseOptions}
              value={unenrollCourseId}
              onChange={handleUnenrollCourseChange}
              searchable
              icon={<IconBook2 size={14} />}
              mb="lg"
            />

            {unenrollCourseId ? (
              <>
                <Group position="apart" mb="sm">
                  <Text size="sm" color="dimmed">
                    {total} learner{total !== 1 ? 's' : ''} enrolled
                    {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
                  </Text>
                  {selectedIds.length > 0 && (
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      leftIcon={<IconUserMinus size={13} />}
                      loading={batchUnenrollMutation.isLoading}
                      onClick={() => batchUnenrollMutation.mutate(selectedIds)}
                    >
                      Unenroll {selectedIds.length} Selected
                    </Button>
                  )}
                </Group>

                {enrolledQuery.isLoading ? (
                  <Center py="xl">
                    <Loader size="sm" />
                  </Center>
                ) : users.length === 0 ? (
                  <Center py="xl">
                    <Text size="sm" color="dimmed">No learners enrolled in this course.</Text>
                  </Center>
                ) : (
                  <>
                    <Table highlightOnHover>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>
                            <Checkbox
                              checked={allOnPageSelected}
                              indeterminate={!allOnPageSelected && someOnPageSelected}
                              onChange={toggleAll}
                            />
                          </th>
                          <th>Learner</th>
                          <th>Email</th>
                          <th>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleUser(user.id)}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.includes(user.id)}
                                onChange={() => toggleUser(user.id)}
                              />
                            </td>
                            <td>
                              <Group spacing="xs" noWrap>
                                <Avatar src={user.picture} size={28} radius="xl" />
                                <Text size="sm" weight={500}>{user.name || '—'}</Text>
                              </Group>
                            </td>
                            <td>
                              <Text size="sm">{user.email}</Text>
                            </td>
                            <td>
                              <Text size="sm" color="dimmed">
                                {user.lastLogin === 'never'
                                  ? 'Never'
                                  : new Date(user.lastLogin).toLocaleDateString()}
                              </Text>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {totalPages > 1 && (
                      <Group position="center" mt="md">
                        <Pagination
                          total={totalPages}
                          value={unenrollPage}
                          onChange={(p) => {
                            setUnenrollPage(p);
                            setSelectedIds([]);
                          }}
                          size="sm"
                        />
                      </Group>
                    )}
                  </>
                )}
              </>
            ) : (
              <Text size="sm" color="dimmed" align="center" py="md">
                Select a course to manage unenrollments.
              </Text>
            )}
          </Box>
        </Tabs.Panel>
      </Tabs>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    await checkAuthorizationForPage(context, 'admin:dashboards');

    const courses = await db.course.findMany({
      where: { archived: false },
      select: { id: true, title: true, users: true },
      orderBy: { title: 'asc' },
    });

    return {
      props: {
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          enrolledCount: c.users.length,
        })),
      },
    };
  },
});
