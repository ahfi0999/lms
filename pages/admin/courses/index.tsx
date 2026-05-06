import { useMemo, useState } from 'react';
import {
  Table,
  Text,
  TextInput,
  Button,
  Flex,
  Switch,
  Stack,
  ActionIcon,
  Anchor,
  Code,
  Paper,
  Badge,
  Menu,
  Pagination,
  Group,
} from '@mantine/core';
import {
  IconSearch,
  IconX,
  IconFilter,
  IconUsers,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import { useRouter } from 'next/router';
import http from '../../../lib/http-client';
import { notify } from '../../../lib/notify';
import AdminLayout from '../../../layouts/admin-layout';
import Link from 'next/link';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import db from '../../../lib/db';
import dayjs from 'dayjs';
import { useDebouncedValue } from '@mantine/hooks';
import Fuse from 'fuse.js';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';

type RowData = InferGetServerSidePropsType<typeof getServerSideProps>['courses'][0];

interface TableSortProps {
  data: RowData[];
}

function CoursesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [debounced] = useDebouncedValue(search, 400);

  const [courseToDelete, setCourseToDelete] = useState<RowData | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const [filterHasUsers, setFilterHasUsers] = useState<boolean | null>(null);
  const [filterHasModules, setFilterHasModules] = useState<boolean | null>(null);

  const filteredData = useMemo(() => {
    let result = props.courses.filter((course) => (archived ? true : !course.archived));

    if (filterHasUsers !== null) {
      result = result.filter((c) => (filterHasUsers ? c.users > 0 : c.users === 0));
    }

    if (filterHasModules !== null) {
      result = result.filter((c) =>
        filterHasModules ? c.modules.length > 0 : c.modules.length === 0
      );
    }

    if (debounced) {
      const fuse = new Fuse(result, {
        keys: ['id', 'title', 'description', 'modules.title'],
        isCaseSensitive: false,
      });
      result = fuse.search(debounced).map((result) => result.item);
    }

    return result;
  }, [props.courses, debounced, archived, filterHasUsers, filterHasModules]);

  const rows = filteredData.map((course) => (
    <tr key={course.id}>
      <td>
        <Text weight={600} size="sm">
          {course.id}
        </Text>
      </td>
      <td>
        <Anchor
          weight={600}
          size="sm"
          color={course.archived ? 'gray' : 'blue.6'}
          component={Link}
          href={`/admin/courses/${course.id}`}
        >
          {course.title}
        </Anchor>
      </td>
      <td>
        <Text maw={300} truncate="end" size="sm" color="dimmed">
          {course.description}
        </Text>
      </td>
      <td>
        <Text size="sm" weight={500}>
          {course.modules.length}
        </Text>
      </td>
      <td>
        <Badge
          color={course.users > 0 ? 'indigo' : 'gray'}
          variant="light"
          leftSection={<IconUsers size={14} style={{ marginTop: 3 }} />}
          styles={{ root: { textTransform: 'none' } }}
          size="lg"
          radius="sm"
        >
          {course.users}
        </Badge>
      </td>
      <td>
        <Text size="sm" color="dimmed">
          {course.updatedAt}
        </Text>
      </td>
      <td>
        <Menu withinPortal position="bottom-end" shadow="sm">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size="1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              icon={<IconEdit size={14} />}
              component={Link}
              href={`/admin/courses/${course.id}`}
            >
              Edit
            </Menu.Item>
            <Menu.Item
              icon={<IconTrash size={14} />}
              color="red"
              onClick={() => setCourseToDelete(course)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </td>
    </tr>
  ));

  return (
    <AdminLayout
      title="Courses"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Courses', href: '/admin/courses' },
      ]}
    >
      <Stack mah="90vh" spacing="md">
        <Modal
          opened={!!courseToDelete}
          onClose={() => {
            setCourseToDelete(null);
            setDeleteConfirmationText('');
          }}
          withCloseButton={false}
          centered
          padding="xl"
          radius="md"
        >
          {courseToDelete && (
            <Stack spacing="lg">
              <Group position="center">
                <ActionIcon
                  color="red"
                  size={60}
                  radius="100%"
                  variant="light"
                  style={{ pointerEvents: 'none' }}
                >
                  <IconAlertTriangle size={34} stroke={1.5} />
                </ActionIcon>
              </Group>
              <Stack spacing="xs" align="center">
                <Text weight={700} size="xl">
                  Delete Course
                </Text>
                <Text size="sm" color="dimmed" align="center">
                  Are you absolutely sure you want to delete this course? This action is permanent
                  and cannot be undone.
                </Text>
              </Stack>

              <Paper withBorder bg="gray.0" p="sm" radius="md">
                <Text size="sm" align="center" weight={500}>
                  Please type{' '}
                  <Text span color="red" weight={700}>
                    {courseToDelete.title}
                  </Text>{' '}
                  to confirm.
                </Text>
              </Paper>

              <TextInput
                placeholder={courseToDelete.title}
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.currentTarget.value)}
                data-autofocus
                styles={(theme) => ({
                  input: {
                    textAlign: 'center',
                    fontWeight: 600,
                    '&:focus-within': { borderColor: theme.colors.red[6] },
                  },
                })}
              />
              <Group grow mt="xs">
                <Button
                  variant="default"
                  size="md"
                  onClick={() => {
                    setCourseToDelete(null);
                    setDeleteConfirmationText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  size="md"
                  disabled={deleteConfirmationText !== courseToDelete.title}
                  loading={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await http.delete(`/api/courses/${courseToDelete.id}`);
                      setCourseToDelete(null);
                      setDeleteConfirmationText('');
                      router.replace(router.asPath);
                      notify({
                        title: 'Success',
                        message: 'Course deleted successfully',
                        type: 'success',
                      });
                    } catch (e) {
                      notify({ title: 'Error', message: 'Failed to delete course', type: 'error' });
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        <Flex direction="row" align="center" justify="space-between" gap="md">
          <TextInput
            placeholder="Search by course title, description or module title"
            icon={<IconSearch size="0.9rem" stroke={1.5} />}
            w="100%"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            rightSection={
              search ? (
                <ActionIcon onClick={() => setSearch('')} variant="transparent" size="sm">
                  <IconX />
                </ActionIcon>
              ) : null
            }
          />
          <Menu shadow="md" width={220} closeOnItemClick={false}>
            <Menu.Target>
              <Button variant="default" leftIcon={<IconFilter size={16} />}>
                Filters{' '}
                {(filterHasUsers !== null || filterHasModules !== null) && (
                  <Badge size="xs" ml={4} color="blue" variant="filled">
                    Active
                  </Badge>
                )}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Enrollment Status</Menu.Label>
              <Menu.Item onClick={() => setFilterHasUsers(filterHasUsers === true ? null : true)}>
                <Group position="apart">
                  <Text size="sm">Has enrolled users</Text>
                  {filterHasUsers === true && <IconCheck size={14} color="#228be6" />}
                </Group>
              </Menu.Item>
              <Menu.Item onClick={() => setFilterHasUsers(filterHasUsers === false ? null : false)}>
                <Group position="apart">
                  <Text size="sm">No enrolled users</Text>
                  {filterHasUsers === false && <IconCheck size={14} color="#228be6" />}
                </Group>
              </Menu.Item>

              <Menu.Divider />
              <Menu.Label>Content Status</Menu.Label>
              <Menu.Item
                onClick={() => setFilterHasModules(filterHasModules === true ? null : true)}
              >
                <Group position="apart">
                  <Text size="sm">Has modules</Text>
                  {filterHasModules === true && <IconCheck size={14} color="#228be6" />}
                </Group>
              </Menu.Item>
              <Menu.Item
                onClick={() => setFilterHasModules(filterHasModules === false ? null : false)}
              >
                <Group position="apart">
                  <Text size="sm">Empty (No modules)</Text>
                  {filterHasModules === false && <IconCheck size={14} color="#228be6" />}
                </Group>
              </Menu.Item>

              {(filterHasUsers !== null || filterHasModules !== null) && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    onClick={() => {
                      setFilterHasUsers(null);
                      setFilterHasModules(null);
                    }}
                  >
                    Clear Filters
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
          <Group spacing="sm" noWrap>
            <Text size="sm" weight={500}>
              Archived
            </Text>
            <Switch
              checked={archived}
              onChange={(event) => setArchived(event.currentTarget.checked)}
            />
          </Group>
          <Button component={Link} href="/admin/courses/new">
            New course
          </Button>
        </Flex>

        <Paper withBorder shadow="sm" radius="md" p={0} sx={{ overflow: 'hidden' }}>
          <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  ID
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  Title
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  Description
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  No. of modules
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  Enrolled users
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  Last updated
                </th>
                <th style={{ color: '#868e96', fontSize: '11px', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
          <Flex
            justify="space-between"
            align="center"
            p="md"
            sx={(theme) => ({ borderTop: `1px solid ${theme.colors.gray[2]}` })}
          >
            <Text size="sm" color="dimmed">
              Showing 1 to {filteredData.length} of {filteredData.length} courses
            </Text>
            <Pagination total={1} value={1} onChange={() => {}} />
          </Flex>
        </Paper>
      </Stack>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    await checkAuthorizationForPage(context, ['read:courses']);
    const courses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        liveLink: true,
        updatedAt: true,
        archived: true,
        picture: true,
        users: true,
        modules: {
          select: {
            _count: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      props: {
        courses: courses.map((course) => ({
          ...course,
          updatedAt: dayjs(course.updatedAt).format('DD/MM/YYYY hh:mm A'),
          users: course.users.length,
        })),
      },
    };
  },
});

export default CoursesPage;
