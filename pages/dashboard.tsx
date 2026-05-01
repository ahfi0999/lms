import {
  Container,
  Center,
  Stack,
  Title,
  Text,
  Box,
  createStyles,
  useMantineTheme,
  Button,
  TextInput,
  Flex,
  Alert,
  CloseButton,
} from '@mantine/core';
import Image from 'next/image';
import { IconLayoutGrid, IconLayoutRows, IconMoodEmpty, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import Fuse from 'fuse.js';
import { CourseListItem } from '../types/courses';
import noCoursesImgSrc from '../assets/undraw_no_data.svg';
import CourseCard from '../components/course-card';
import RootLayout from '../layouts/root';
import db from '../lib/db';
import CourseRow from '../components/CourseRow';
import useShowUrlMessage from '../hooks/useShowUrlMessage';
import HomePageProps from '../components/HomePageCarousel';
import WelcomeText from '../components/WelcomeText';
import quotes from '../lib/data/quotes.json';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { getSessionOrThrow, checkAuthorizationForPage } from '../lib/auth-utils';
import logger from '../lib/logger';
import account from '../lib/data/account';

type HomePageProps = {
  courses: CourseListItem[];
  quoteData: {
    quote: string;
    author: string;
  };
};
const useStyles = createStyles(() => ({
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gridAutoRows: '600px',
    gridGap: 20,
    alignItems: 'stretch',
    justifyContent: 'center',

    '@media (max-width: 450px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    },
  },
}));

export default function HomePage(props: HomePageProps) {
  const { classes } = useStyles();
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'rows'>('rows');
  const mobileScreen = useMediaQuery('(max-width: 700px)', false, {
    getInitialValueInEffect: false,
  });
  const theme = useMantineTheme();
  useShowUrlMessage();

  const fuse = new Fuse(props.courses, {
    keys: ['title', 'description'],
  });

  const filteredCourses = search ? fuse.search(search).map((result) => result.item) : props.courses;

  if (mobileScreen && layout === 'rows') setLayout('grid');

  if (props.courses.length === 0) {
    return (
      <RootLayout>
        <Container mt={60}>
          <Center>
            <Stack spacing="xl">
              <Center>
                <Image src={noCoursesImgSrc} alt="No courses" width={400} />
              </Center>
              <Title align="center" order={2}>
                Enrolled courses will appear here.{' '}
              </Title>
              <Text color="dimmed" align="center">
                If you are enrolled in a course but it is not listed here, please contact support
                using live chat for assistance.
              </Text>
            </Stack>
          </Center>
        </Container>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <Container fluid>
        <Container size="lg">
          <Stack mb="xl">
            <WelcomeText {...props.quoteData} />
            <Title order={2}>My Courses</Title>
            <Flex gap="xl" justify="space-between" align="center">
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                icon={<IconSearch />}
                rightSection={<CloseButton onClick={() => setSearch('')} />}
                placeholder="Search Courses..."
                w="100%"
              />
              {mobileScreen ? null : (
                <Flex>
                  <Button
                    sx={{
                      borderEndEndRadius: 0,
                      borderStartEndRadius: 0,
                    }}
                    onClick={() => setLayout('rows')}
                    variant={layout === 'rows' ? 'filled' : 'outline'}
                  >
                    <IconLayoutRows size={20} />
                  </Button>
                  <Button
                    sx={{
                      borderEndStartRadius: 0,
                      borderStartStartRadius: 0,
                    }}
                    onClick={() => setLayout('grid')}
                    variant={layout === 'grid' ? 'filled' : 'outline'}
                  >
                    <IconLayoutGrid size={20} />
                  </Button>
                </Flex>
              )}
            </Flex>
          </Stack>
          {filteredCourses.length === 0 ? (
            <Alert icon={<IconMoodEmpty />}>
              No courses found with the search term{' '}
              <Text component="span" size="sm" weight={500} color="blue">
                "{search}"
              </Text>
              .
            </Alert>
          ) : layout === 'grid' ? (
            <Box className={classes.wrapper}>
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </Box>
          ) : (
            <Stack spacing="xl">
              {filteredCourses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </Stack>
          )}
        </Container>
      </Container>
    </RootLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    let user;
    try {
      const session = await getSessionOrThrow(context.req, context.res);
      user = session.user;
      await checkAuthorizationForPage(context, 'read:mycourses');
    } catch (error) {
      // redirected to login
      logger.error(error);
      return {
        redirect: {
          destination: `/api/auth/login?returnTo=/dashboard&audience=${encodeURIComponent(
            process.env.NEXT_PUBLIC_AUTH0_API_APP_IDENTIFIER
          )}`,
          permanent: false,
        },
      };
    }

    const courses = await db.course.findMany({
      where: {
        users: {
          has: user.sub,
        },
        archived: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentLink: true,
        picture: true,
        liveLink: true,
        updatedAt: true,
        modules: {
          select: {
            _count: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const quoteData = quotes[Math.floor(Math.random() * quotes.length)];

    return {
      props: {
        courses: courses
          .filter((course) => course.modules.length > 0)
          .map((course) => ({ ...course, updatedAt: course.updatedAt.toISOString() })), // Filter out courses with no modules
        quoteData,
        account: account,
      },
    };
  },
});
