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
  Paper,
  Blockquote,
  Badge,
  Group,
  ActionIcon,
  ThemeIcon,
  SimpleGrid,
  keyframes,
} from '@mantine/core';
import Image from 'next/image';
import {
  IconBook2,
  IconClockHour4,
  IconLayoutGrid,
  IconLayoutRows,
  IconMoodEmpty,
  IconSchool,
  IconSearch,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
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
  userName: string;
  stats: {
    totalCourses: number;
    totalModules: number;
    lastActivityLabel: string;
  };
};
const fadeUp = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gridGap: 24,
    alignItems: 'stretch',
    justifyContent: 'center',

    '@media (max-width: 450px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    },
  },
  hero: {
    background:
      theme.colorScheme === 'dark'
        ? `linear-gradient(135deg, ${theme.colors.dark[6]} 0%, ${theme.colors.dark[7]} 100%)`
        : 'linear-gradient(90deg, #ffffff 0%, #ffffff 55%, #fff3e6 100%)',
    borderRadius: theme.radius.lg,
    padding: `${theme.spacing.xl}px ${theme.spacing.xl}px`,
  },
  heroTitle: {
    fontSize: '6.5rem',
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: 0,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    [`@media (max-width: 1300px)`]: {
      fontSize: '5rem',
    },
    [`@media (max-width: 1000px)`]: {
      fontSize: '3.75rem',
    },
    [`@media (max-width: 700px)`]: {
      fontSize: '2.75rem',
    },
  },
  titlePart: {
    transition: 'color 400ms ease',
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
  },
  learnActive: {
    background: 'linear-gradient(90deg, #ff3b30, #ff7a00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  doActive: {
    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  growActive: {
    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  quoteBox: {
    borderLeft: `4px solid ${theme.colors.orange[5]}`,
    paddingLeft: theme.spacing.md,
    fontStyle: 'italic',
    color: theme.colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.gray[7],
  },
  greeting: {
    fontWeight: 600,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6],
    letterSpacing: 0.3,
  },
  searchInput: {
    flex: 1,
  },
  toggleBtn: {
    transition: 'transform 120ms ease',
    '&:active': { transform: 'scale(0.96)' },
  },
  statCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    transition: 'transform 200ms ease, box-shadow 200ms ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.sm,
    },
  },
  statValue: {
    fontWeight: 800,
    fontSize: '1.75rem',
    lineHeight: 1.1,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
  },
  cardEnter: {
    animation: `${fadeUp} 360ms ease both`,
  },
}));

const TITLE_PARTS = ['Learn.', 'Do.', 'Grow.'] as const;

export default function HomePage(props: HomePageProps) {
  const { classes, cx } = useStyles();
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'rows'>('grid');
  const [activePart, setActivePart] = useState(0);
  const mobileScreen = useMediaQuery('(max-width: 700px)', false, {
    getInitialValueInEffect: false,
  });
  const theme = useMantineTheme();
  useShowUrlMessage();

  useEffect(() => {
    const id = setInterval(() => {
      setActivePart((prev) => (prev + 1) % TITLE_PARTS.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const partClass = [classes.learnActive, classes.doActive, classes.growActive];

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
        <Container size={1400} px="md">
          <Paper className={classes.hero} mt="xl" mb="xl" withBorder={false} shadow="xs">
            <Flex direction={{ base: 'column', sm: 'row' }} align="center" gap="xl">
              <Stack spacing="lg" sx={{ flex: 1 }}>
                <Text className={classes.heroTitle} component="h1">
                  {TITLE_PARTS.map((part, idx) => (
                    <Text
                      key={part}
                      component="span"
                      inherit
                      mr="sm"
                      className={cx(classes.titlePart, {
                        [partClass[idx]]: activePart === idx,
                      })}
                    >
                      {part}
                    </Text>
                  ))}
                </Text>
                <Blockquote
                  className={classes.quoteBox}
                  cite={`— ${props.quoteData.author}`}
                  styles={{ root: { padding: 0, border: 'none' }, icon: { display: 'none' } }}
                >
                  <Text size="md">{props.quoteData.quote}</Text>
                </Blockquote>
              </Stack>
              <Box
                sx={(t) => ({
                  flexShrink: 0,
                  position: 'relative',
                  width: 260,
                  height: 220,
                  borderRadius: t.radius.lg,
                  padding: t.colorScheme === 'dark' ? t.spacing.sm : 0,
                  backgroundColor:
                    t.colorScheme === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #fff3e6 100%)'
                      : 'transparent',
                  background:
                    t.colorScheme === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #fff3e6 100%)'
                      : 'transparent',
                })}
              >
                <Image
                  src="/img/hero-illustration.png"
                  alt="Graduation cap on books"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
            </Flex>
          </Paper>
          <Stack mb="xl" spacing="md">
            <Group spacing="sm" align="center">
              <Title order={2}>My Courses</Title>
              <Badge
                color="blue"
                variant="light"
                size="xl"
                radius="md"
                styles={(theme) => ({
                  root: {
                    paddingInline: theme.spacing.md,
                    height: 32,
                  },
                  inner: {
                    fontSize: theme.fontSizes.md,
                    fontWeight: 700,
                    fontFamily: theme.fontFamily,
                    textTransform: 'none',
                    letterSpacing: 0,
                  },
                })}
              >
                {props.courses.length}
              </Badge>
            </Group>
            <Flex gap="md" justify="space-between" align="center">
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                icon={<IconSearch size={18} />}
                rightSection={search ? <CloseButton onClick={() => setSearch('')} /> : null}
                placeholder="Search courses by title or description..."
                size="md"
                radius="md"
                className={classes.searchInput}
              />
              {mobileScreen ? null : (
                <Group spacing={4} noWrap>
                  <ActionIcon
                    size="lg"
                    variant={layout === 'rows' ? 'filled' : 'light'}
                    color="blue"
                    onClick={() => setLayout('rows')}
                    className={classes.toggleBtn}
                    radius="md"
                    aria-label="Row layout"
                  >
                    <IconLayoutRows size={18} />
                  </ActionIcon>
                  <ActionIcon
                    size="lg"
                    variant={layout === 'grid' ? 'filled' : 'light'}
                    color="blue"
                    onClick={() => setLayout('grid')}
                    className={classes.toggleBtn}
                    radius="md"
                    aria-label="Grid layout"
                  >
                    <IconLayoutGrid size={18} />
                  </ActionIcon>
                </Group>
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
              {filteredCourses.map((course, idx) => (
                <Box
                  key={course.id}
                  className={classes.cardEnter}
                  sx={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                >
                  <CourseCard course={course} />
                </Box>
              ))}
            </Box>
          ) : (
            <Stack spacing="xl">
              {filteredCourses.map((course, idx) => (
                <Box
                  key={course.id}
                  className={classes.cardEnter}
                  sx={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                >
                  <CourseRow course={course} />
                </Box>
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

    const visibleCourses = courses.filter((course) => course.modules.length > 0);
    const totalModules = visibleCourses.reduce((sum, course) => sum + course.modules.length, 0);
    const lastActivityDate = visibleCourses[0]?.updatedAt || null;
    const lastActivityLabel = lastActivityDate
      ? lastActivityDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

    return {
      props: {
        courses: visibleCourses.map((course) => ({
          ...course,
          updatedAt: course.updatedAt.toISOString(),
        })),
        quoteData,
        account: account,
        userName: user?.name || user?.nickname || '',
        stats: {
          totalCourses: visibleCourses.length,
          totalModules,
          lastActivityLabel,
        },
      },
    };
  },
});
