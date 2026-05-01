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
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
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

  const filteredData = useMemo(() => {
    if (!debounced) {
      return props.courses.filter((course) => (archived ? true : !course.archived));
    }

    const fuse = new Fuse(props.courses, {
      keys: ['id', 'title', 'description', 'modules.title'],
      isCaseSensitive: false,
    });

    return fuse
      .search(debounced)
      .map((result) => result.item)
      .filter((course) => (archived ? true : !course.archived));
  }, [props.courses, debounced, archived]);

  const rows = filteredData.map((course) => (
    <tr key={course.id}>
      <td>
        <Code>{course.id}</Code>
      </td>
      <td>
        <Anchor
          color={course.archived ? 'gray' : 'blue'}
          component={Link}
          href={`/admin/courses/${course.id}`}
        >
          {course.title}
        </Anchor>
      </td>
      <td>
        <Text maw={300} truncate="end">
          {course.description}
        </Text>
      </td>
      <td>{course.modules.length}</td>
      <td>{course.users}</td>
      <td>{course.updatedAt}</td>
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
        <Flex direction="row" align="end" justify="space-between" gap="md">
          <TextInput
            placeholder="Search by any field"
            icon={<IconSearch size="0.9rem" stroke={1.5} />}
            w="100%"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            description="Search by course title, description or module title"
            rightSection={
              search ? (
                <ActionIcon onClick={() => setSearch('')} variant="light" size="sm">
                  <IconX />
                </ActionIcon>
              ) : null
            }
          />
          <Switch
            mb="xs"
            label="Archived"
            checked={archived}
            onChange={(event) => setArchived(event.currentTarget.checked)}
          />
          <Button component={Link} href="/admin/courses/new">
            New course
          </Button>
        </Flex>
        <Table highlightOnHover striped verticalSpacing="md">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>No. of modules</th>
              <th>Enrolled users</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
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
