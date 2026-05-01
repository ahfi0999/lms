import { useState } from 'react';
import AdminLayout from '../../../layouts/admin-layout';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import authzAdmin from '../../../lib/auth0/authzAdmin';
import { z } from 'zod';
import db from '../../../lib/db';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';
import { useRouter } from 'next/router';
import {
  Alert,
  Box,
  Button,
  Center,
  Code,
  Container,
  Group,
  Paper,
  Space,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  createStyles,
} from '@mantine/core';
import Image from 'next/image';
import { IconError404, IconMoodEmpty } from '@tabler/icons-react';
import { Permission, UserInfo } from '../../../types/auth0';
import logger from '../../../lib/logger';
import { Course } from '../../../types/courses';
import UnenrollButton from '../../../components/UnenrollButton';

const useStyles = createStyles((theme) => ({
  dl: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  dt: {
    fontWeight: 600,
  },
  dd: {
    marginBottom: 0,
  },
}));

type ManageUserPageProps =
  | {
      result: 'success';
      data: UserInfo & {
        courses: Pick<Course, 'id' | 'title' | 'archived'>[];
      };
    }
  | {
      result: 'error';
      message: string;
    };

function ManageUserPage(props: ManageUserPageProps) {
  console.log('🚀 ~ file: manage-user.tsx:61 ~ ManageUserPage ~ props:', props);
  const router = useRouter();
  const styles = useStyles();

  const [email, setEmail] = useState<string>(router.query.email as string);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/admin/learners/manage-user?email=${encodeURIComponent(email)}`);
  };

  const handleReset = () => {
    setEmail('');
    router.push(router.pathname);
  };

  return (
    <AdminLayout
      title="Fetch User Info"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Manage User', href: '/admin/learners/manage-user' },
      ]}
    >
      <Container>
        <Stack spacing="xl">
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                required
                withAsterisk
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Group>
                <Button
                  type="submit"
                  disabled={!email || !z.string().email().safeParse(email).success}
                >
                  Submit
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </Group>
            </Stack>
          </form>

          {props.result === 'success' ? (
            <Paper p="md" withBorder>
              <Stack spacing="xl">
                <Stack spacing={0}>
                  <Title align="center" order={3}>
                    {props.data.name}
                  </Title>
                  <Text align="center" size="sm">
                    {props.data.email}
                  </Text>
                </Stack>

                <Stack>
                  <Center>
                    <Image
                      alt="Profile picture"
                      width={200}
                      height={200}
                      src={props.data.picture}
                    />
                  </Center>
                  <Box>
                    <dl className={styles.classes.dl}>
                      <dt className={styles.classes.dt}>Last Login: </dt>
                      <dd className={styles.classes.dd}>{props.data.lastLogin}</dd>

                      <dt className={styles.classes.dt}>Email Verifie: d</dt>
                      <dd className={styles.classes.dd}>
                        {props.data.emailVerified ? 'Yes' : 'No'}
                      </dd>

                      <dt className={styles.classes.dt}>Enrolled Courses: </dt>
                      <dd className={styles.classes.dd}>{props.data.courses.length}</dd>

                      <dt className={styles.classes.dt}>Auth0 ID: </dt>
                      <dd className={styles.classes.dd}>
                        <Code>{props.data.id}</Code>
                      </dd>
                    </dl>
                  </Box>
                </Stack>

                <Stack>
                  <Title align="center" order={4}>
                    Courses
                  </Title>
                  {props.data.courses.length === 0 ? (
                    <Alert icon={<IconMoodEmpty />} variant="light" color="blue">
                      User is not enrolled in any courses
                    </Alert>
                  ) : (
                    <Table withBorder variant="striped" highlightOnHover withColumnBorders>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Course</th>
                          <th>Archived</th>
                          <th>
                            <Text align="center">Unenroll</Text>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.data.courses.map((course) => (
                          <tr key={course.id}>
                            <td>
                              <Code>{course.id}</Code>
                            </td>
                            <td>
                              <Text>{course.title}</Text>
                            </td>
                            <td>{course.archived ? 'Yes' : 'No'}</td>
                            <td>
                              <UnenrollButton courseId={course.id} userId={props.data.id} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ) : null}

          {props.result === 'error' ? (
            <Alert icon={<IconError404 />} variant="light" color="red">
              {props.message}
            </Alert>
          ) : null}
        </Stack>
        <Space h="xl" />
      </Container>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    await checkAuthorizationForPage(context, [
      'read:users',
      'update:courses',
      'update:users',
    ] as Permission[]);
    const email = z.string().email().safeParse(context.query.email);

    if (!email.success) {
      return {
        props: {},
      };
    }
    console.log('🚀 ~ file: manage-user.tsx:216 ~ getServerSideProps: ~ email:', email.data);

    let userAuth0Data;
    try {
      const res = await authzAdmin.getUsersByEmail(email.data);
      userAuth0Data = res[0];
    } catch (error) {
      logger.error({ error });
    }

    if (!userAuth0Data) {
      return {
        props: {
          result: 'error',
          message: 'User not found',
        } as ManageUserPageProps,
      };
    }

    const enrolledCourses = await db.course.findMany({
      where: {
        users: {
          has: userAuth0Data.user_id,
        },
      },

      select: {
        id: true,
        title: true,
        archived: true,
      },
    });

    return {
      props: {
        result: 'success',
        data: {
          id: userAuth0Data.user_id,
          email: userAuth0Data.email,
          name: userAuth0Data.name,
          picture: userAuth0Data.picture,
          lastLogin: userAuth0Data.last_login || null,
          emailVerified: userAuth0Data.email_verified,
          courses: enrolledCourses,
        },
      } as ManageUserPageProps,
    };
  },
});

export default ManageUserPage;
