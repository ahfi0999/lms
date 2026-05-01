import { useState } from 'react';
import {
  Alert,
  AspectRatio,
  Burger,
  Center,
  Drawer,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Space,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBook,
  IconBulb,
  IconFiles,
  IconGift,
  IconHandClick,
  IconPaperclip,
  IconReportAnalytics,
  IconVideo,
} from '@tabler/icons-react';
import { useDisclosure, useDocumentTitle, useMediaQuery } from '@mantine/hooks';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { Topic } from '../../types/courses';
import RootLayout from '../../layouts/root';
import { idSchema } from '../../lib/schemas/zod-schemas';
import AskAI from '../../components/AskAI';
import CourseSyllabus from '../../components/CourseSyllabus';
import noVideoSelectedImgSrc from '../../assets/undraw_playlist.svg';
import Image from 'next/image';
import db from '../../lib/db';
import ReactPlayer from 'react-player';
import { useWindowReady } from '../../hooks/useWindowReady';
import Resources from '../../components/Resources';
import ProjectFiles from '../../components/ProjectFiles';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { checkAuthorizationForPage, getSessionOrThrow } from '../../lib/auth-utils';
import useRABC from '../../hooks/useRABC';
import account from '../../lib/data/account';

type CoursePageProps = InferGetServerSidePropsType<typeof getServerSideProps>;
function CoursePage(props: CoursePageProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [openChapters, setOpenChapters] = useState<number[]>([
    idSchema.parse(props.course.modules.at(-1)?.id),
  ]);
  const [opened, { open, close }] = useDisclosure(false);
  const rabc = useRABC();

  const theme = useMantineTheme();
  const alternateLayout = useMediaQuery('(max-width: 1270px)');
  const isWindowReady = useWindowReady();
  const toggleChapter = (chapterIds: number[]) => {
    setOpenChapters(chapterIds);
  };

  const toggleTopic = (topic: Topic) => {
    setSelectedTopic(topic.id === selectedTopic?.id ? null : topic);
  };

  useDocumentTitle(`${props.course.title} | ${account.name}`);

  return (
    <RootLayout>
      <Stack spacing="xl">
        <Grid columns={12} h={alternateLayout ? undefined : '80vh'}>
          {alternateLayout ? (
            <Grid.Col span={12}>
              <Paper p="md">
                <Group>
                  <Tooltip label="Syllabus">
                    <Burger opened={opened} onClick={open} />
                  </Tooltip>
                  <Drawer
                    opened={opened}
                    padding={0}
                    onClose={close}
                    closeButtonProps={{
                      size: 'lg',
                      pr: 'md',
                    }}
                    title={
                      <Title size="h4" p="md">
                        Syllabus
                      </Title>
                    }
                  >
                    <CourseSyllabus
                      toggleChapter={toggleChapter}
                      toggleTopic={toggleTopic}
                      course={props.course}
                      openChapters={openChapters}
                      selectedTopic={selectedTopic}
                      closeSyllabusDrawer={close}
                    />
                  </Drawer>
                  <Title size="h2" order={1} truncate title={props.course.title}>
                    {props.course.title}
                  </Title>
                </Group>
              </Paper>
            </Grid.Col>
          ) : (
            <Grid.Col span={3}>
              <Paper component={ScrollArea} h="86vh" p="md" scrollbarSize={10} type="hover">
                <Title pb="md" size="h2" order={1} truncate title={props.course.title}>
                  {props.course.title}
                </Title>
                <CourseSyllabus
                  toggleChapter={toggleChapter}
                  toggleTopic={toggleTopic}
                  course={props.course}
                  openChapters={openChapters}
                  selectedTopic={selectedTopic}
                />
              </Paper>
            </Grid.Col>
          )}
          <Grid.Col span="auto">
            {selectedTopic?.videoLink && isWindowReady ? (
              <Tabs defaultValue="video">
                <Tabs.List>
                  <Tabs.Tab value="video" icon={<IconVideo size="0.8rem" />}>
                    Video
                  </Tabs.Tab>
                  <Tabs.Tab value="notes" icon={<IconBook size="0.8rem" />}>
                    Notes
                  </Tabs.Tab>
                  <Tabs.Tab value="resources" icon={<IconBook size="0.8rem" />}>
                    Resources
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="video" pt="xs">
                  <AspectRatio ratio={16 / 9}>
                    <ReactPlayer
                      width="100%"
                      height="100%"
                      playing={true}
                      url={selectedTopic?.videoLink}
                      controls={true}
                    />
                  </AspectRatio>
                </Tabs.Panel>

                <Tabs.Panel value="notes" pt="xs">
                  <Alert>
                    <Text size="sm" color="gray">
                      Coming soon!
                    </Text>
                  </Alert>
                </Tabs.Panel>

                <Tabs.Panel value="resources" pt="xs">
                  <Resources
                    permissions={rabc.permissions}
                    resourceFiles={selectedTopic.attachments}
                  />
                </Tabs.Panel>
              </Tabs>
            ) : (
              <Center h="100%">
                <Stack>
                  <Image
                    src={noVideoSelectedImgSrc}
                    alt="No video selected"
                    width={400}
                    height={400}
                  />
                  <Alert icon={<IconHandClick />} color="blue">
                    Select a topic to view the video.
                  </Alert>
                </Stack>
              </Center>
            )}
          </Grid.Col>
        </Grid>
        <Space h="lg" />
        <Tabs defaultValue="Course" bg="white" p="md">
          <Tabs.List>
            <Tabs.Tab value="Course" icon={<IconBook size="0.8rem" />}>
              Course
            </Tabs.Tab>
            <Tabs.Tab value="Ask AI" icon={<IconBulb size="0.8rem" />}>
              Ask AI
            </Tabs.Tab>
            <Tabs.Tab value="Resources" icon={<IconPaperclip size="0.8rem" />}>
              Resources
            </Tabs.Tab>
            <Tabs.Tab value="Projects" icon={<IconFiles size="0.8rem" />}>
              Projects
            </Tabs.Tab>
            <Tabs.Tab value="Resume" icon={<IconReportAnalytics size="0.8rem" />}>
              Resume
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel mih={200} value="Course" pt="md">
            <Stack spacing="md">
              <Title order={2} size="h3">
                {props.course.title}
              </Title>
              <Text color="gray">{props.course.description}</Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel mih={200} value="Resources" pt="md">
            <Resources permissions={rabc.permissions} resourceFiles={props.course.resourceFiles} />
          </Tabs.Panel>

          <Tabs.Panel mih={200} value="Projects" pt="md">
            <ProjectFiles permissions={rabc.permissions} projectFiles={props.course.projectFiles} />
          </Tabs.Panel>

          <Tabs.Panel mih={200} value="Resume" pt="md">
            <Alert icon={<IconGift />}>Coming soon!</Alert>
          </Tabs.Panel>

          <Tabs.Panel mih={200} value="Ask AI" pt="md">
            <AskAI />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </RootLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    await checkAuthorizationForPage(context, 'read:mycourses');
    const { user } = await getSessionOrThrow(context.req, context.res);
    const courseId = idSchema.parse(context.params?.id);
    const course = await db.course.findFirstOrThrow({
      where: {
        id: courseId,
        users: {
          has: user.sub,
        },
        archived: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        picture: true,
        contentLink: true,
        liveLink: true,
        archived: true,
        modulesOrder: true,
        modules: {
          select: {
            id: true,
            title: true,
            topics: {
              select: {
                id: true,
                title: true,
                videoLink: true,
                attachments: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    file: true,
                  },
                },
              },
            },
          },
        },
        resourceFiles: {
          select: {
            id: true,
            title: true,
            description: true,
            file: true,
          },
        },
        projectFiles: {
          select: {
            id: true,
            title: true,
            description: true,
            file: true,
          },
        },
        assignments: {
          select: {
            id: true,
            attachment: {
              select: {
                id: true,
                title: true,
                description: true,
                file: true,
              },
            },
          },
          where: {
            user: {
              equals: user.sub,
            },
          },
        },
        resumeFiles: true,
      },
    });

    return {
      props: {
        course,
        user,
      },
    };
  },
});

export default CoursePage;
