import {
  Alert,
  Anchor,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  Group,
  Mark,
  Paper,
  Popover,
  Space,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
  createStyles,
  rem,
} from '@mantine/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AdminLayout from '../../../layouts/admin-layout';
import {
  idSchema,
  moduleOrderChangeSchema,
  attachmentSchema,
} from '../../../lib/schemas/zod-schemas';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import http from '../../../lib/http-client';
import { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { notify } from '../../../lib/notify';
import { useEffect, useMemo, useState } from 'react';
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatDateWithTime } from '../../../lib/dates';
import { useDisclosure } from '@mantine/hooks';
import AddNewModuleForm from '../../../components/AddNewModuleForm';
import { modals, openContextModal } from '@mantine/modals';
import { useWindowReady } from '../../../hooks/useWindowReady';
import ProjectFiles from '../../../components/ProjectFiles';
import Resources from '../../../components/Resources';
import EditCourseDetails from '../../../components/edit-course-details';
import { getCourseDataForAdminPage } from '../../../lib/data/courses';
import EditModule from '../../../components/EditModule';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import useRABC from '../../../hooks/useRABC';
import EnrolledBy from '../../../components/EnrolledBy';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';
import { Permission } from '../../../types/auth0';
import BulkEnrollment from '../../../components/BulkEnrollment';
import AccessActivityHistory from '../../../components/AccessActivityHistory';

const useStyles = createStyles((theme) => ({
  item: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
  },

  dragHandle: {
    ...theme.fn.focusStyles(),
    width: rem(40),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6],
  },

  accordionTarget: {
    ...theme.fn.focusStyles(),

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },
}));

const tabs = {
  details: {
    title: 'Details',
    value: 'details',
  },
  modules: {
    title: 'Modules',
    value: 'modules',
  },
  resources: {
    title: 'Resources',
    value: 'resources',
  },
  enrolledBy: {
    title: 'Enrolled By',
    value: 'enrolledBy',
  },
  settings: {
    title: 'Settings',
    value: 'settings',
  },
} as const;

type CourseTab = keyof typeof tabs;

function CourseAdminPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { classes } = useStyles();

  const windowReady = useWindowReady();
  const [activeTab, setActiveTab] = useState<CourseTab | null>('details');
  const router = useRouter();
  const rabc = useRABC();

  const [viewAccessActivityHistory, setViewAccessActivityHistory] = useState(false);
  const [moduleOrder, setModuleOrder] = useState<number[]>(props.course.modulesOrder || []);
  const [openedAddNewTopics, setOpenedAddNewTopics] = useState<number[]>([]);
  const toggleAddNewTopic = (moduleId: number) => {
    if (openedAddNewTopics.includes(moduleId)) {
      setOpenedAddNewTopics((prevState) => prevState.filter((i) => i !== moduleId));
    } else {
      setOpenedAddNewTopics([...openedAddNewTopics, moduleId]);
    }
  };
  const isAddNewTopicOpen = (moduleId: number) => {
    return openedAddNewTopics.includes(moduleId);
  };

  const [openedAddNewModule, { toggle: toggleAddNewModule }] = useDisclosure(false);
  const [openedModules, setOpenedModules] = useState<number[]>([]);
  const toggleModuleAccordion = (moduleId: number) => {
    if (openedModules.includes(moduleId)) {
      setOpenedModules((prevState) => prevState.filter((i) => i !== moduleId));
    } else {
      setOpenedModules([...openedModules, moduleId]);
    }
  };
  const isModuleAccordionOpen = (moduleId: number) => {
    return openedModules.includes(moduleId);
  };
  const refreshData = () => {
    router.replace(router.asPath);
  };

  const courseArchiveMutation = useMutation({
    mutationKey: ['courses', 'patch'],
    mutationFn: async () => {
      const response = await http.patch(`/api/courses/${props.course.id}/archive`);
      return response.data;
    },
    onSuccess: () => {
      refreshData();
      notify({
        message: props.course.archived ? 'Course unarchived' : 'Course archived',
        type: 'success',
      });
    },
  });

  const handleArchive = () => {
    courseArchiveMutation.mutate();
  };

  useEffect(() => {
    if (props.course.modulesOrder) {
      setModuleOrder(props.course.modulesOrder);
    }
  }, [props.course.modulesOrder]);

  type ModuleOrderChangeData = z.infer<typeof moduleOrderChangeSchema>;
  const moduleOrderChangeMutation = useMutation({
    mutationKey: ['courses', 'module-order'],
    mutationFn: async (data: ModuleOrderChangeData) => {
      const response = await http.post(`/api/courses/module-order`, data);
      return response.data;
    },
    onSuccess: () => {
      notify({
        title: 'Modules order changed',
        message: 'Modules order changed successfully',
        type: 'success',
        id: 'modules-order-changed',
      });
    },
    onSettled: () => {
      refreshData();
    },
  });

  const handleModuleOrderChange = (data: ModuleOrderChangeData) => {
    // Do optimistic update
    const newOrder = [...moduleOrder];
    newOrder[data.source] = moduleOrder[data.destination];
    newOrder[data.destination] = moduleOrder[data.source];
    setModuleOrder(newOrder);
    moduleOrderChangeMutation.mutate(data);
  };

  const deleteCourseMutation = useMutation({
    mutationKey: ['courses', 'delete'],
    mutationFn: async (courseId: number) => {
      const response = await http.delete(`/api/courses/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      router.push('/admin/courses');
      notify({
        title: 'Course archived',
        message: 'Course archived successfully',
        type: 'success',
      });
    },
  });
  const handleArchiveCourse = () => {
    modals.openConfirmModal({
      title: 'Please confirm',
      children: (
        <Text size="sm">
          Are you sure you want to archive the course <Mark>{props.course.title}</Mark>? Course will
          not longer be available for enrolled students.
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onConfirm: () => {
        deleteCourseMutation.mutate(props.course.id);
      },
      onCancel: () => {
        modals.closeAll();
      },
    });
  };

  const handleAttachmentUpload = (type: z.infer<typeof attachmentSchema>['type']) => {
    openContextModal({
      modal: 'uploadAttachment',
      title: 'Upload Attachment',
      innerProps: {
        attachmentType: type,
        courseId: props.course.id,
      },
    });
  };

  const orderedModules = useMemo(() => {
    const modules = props.course.modules;
    const orderedModules = [];
    for (let i = 0; i < moduleOrder.length; i++) {
      const module = modules.find((module) => module.id === moduleOrder[i]);
      if (module) {
        orderedModules.push(module);
      }
    }
    return orderedModules;
  }, [props.course.modules, moduleOrder]);

  const items = orderedModules.map((module, index) => (
    <Draggable
      isDragDisabled={props.course.modules.length === 1}
      key={module.id}
      index={index}
      draggableId={module.id.toString()}
    >
      {(provided) => (
        <Flex
          className={classes.item}
          ref={provided.innerRef}
          {...provided.draggableProps}
          align="center"
          gap="xl"
          w="100%"
          mb="xl"
        >
          <div className={classes.dragHandle} {...provided.dragHandleProps}>
            <IconGripVertical size="1.5rem" stroke={1.5} />
          </div>

          <Paper w="inherit" withBorder shadow="md">
            <UnstyledButton
              className={classes.accordionTarget}
              w="100%"
              onClick={() => toggleModuleAccordion(module.id)}
            >
              <Group position="apart" p="md">
                <Stack spacing={4}>
                  <Title order={5} pr="auto">
                    {`${index + 1}. ${module.title}`}
                  </Title>
                  <Text color="dimmed" size="sm">
                    <Tooltip label="Last updated at" position="bottom">
                      <span>{formatDateWithTime(module.updatedAt)}</span>
                    </Tooltip>
                  </Text>
                </Stack>
                {isModuleAccordionOpen(module.id) ? (
                  <IconChevronUp size="1.5rem" />
                ) : (
                  <IconChevronDown size="1.5rem" />
                )}
              </Group>
            </UnstyledButton>
            <Collapse sx={{ width: '100%' }} in={isModuleAccordionOpen(module.id)}>
              <Stack spacing="xl" p="md" pt="sm">
                <EditModule courseId={props.course.id} moduleId={module.id} module={module} />
              </Stack>
            </Collapse>
          </Paper>
        </Flex>
      )}
    </Draggable>
  ));

  return (
    <AdminLayout
      title={props.course.title}
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Courses', href: '/admin/courses' },
        {
          title: props.course.title,
          href: `/admin/courses/${props.course?.id}`,
        },
      ]}
    >
      {props.course.archived ? (
        <Alert mb="lg" icon={<IconAlertCircle />} color="red" title="Course archived">
          This course is archived. You can unarchive it in the settings tab.
        </Alert>
      ) : null}
      <Tabs
        value={activeTab}
        variant="default"
        onTabChange={(value) => setActiveTab(value as CourseTab)}
      >
        <Tabs.List mb="lg">
          <Tabs.Tab value={tabs.details.value}>
            <Title order={5}>{tabs.details.title}</Title>
          </Tabs.Tab>
          <Tabs.Tab value={tabs.modules.value}>
            <Title order={5}>{tabs.modules.title}</Title>
          </Tabs.Tab>
          <Tabs.Tab value={tabs.resources.value}>
            <Title order={5}>{tabs.resources.title}</Title>
          </Tabs.Tab>
          <Tabs.Tab value={tabs.enrolledBy.value}>
            <Title order={5}>{tabs.enrolledBy.title}</Title>
          </Tabs.Tab>
          <Tabs.Tab value={tabs.settings.value}>
            <Title order={5}>{tabs.settings.title}</Title>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
          <EditCourseDetails course={props.course} />
        </Tabs.Panel>
        <Tabs.Panel value={tabs.modules.value}>
          <Container fluid>
            <Stack spacing="xl">
              <Group position="right">
                <Popover
                  opened={openedAddNewModule}
                  onChange={toggleAddNewModule}
                  width={600}
                  trapFocus
                  position="left"
                  withArrow
                  shadow="md"
                >
                  <Popover.Target>
                    <Button onClick={() => toggleAddNewModule()} variant="outline">
                      Add new module
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown
                    sx={(theme) => ({
                      background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                    })}
                    w="100%"
                  >
                    <AddNewModuleForm
                      cancel={() => toggleAddNewModule()}
                      courseId={props.course.id}
                    />
                  </Popover.Dropdown>
                </Popover>
              </Group>
              <Box pos="relative">
                {props.course?.modules && props.course?.modules.length > 0 && windowReady ? (
                  <DragDropContext
                    onDragEnd={({ destination, source }) => {
                      if (!destination) {
                        return;
                      }
                      handleModuleOrderChange({
                        source: source.index,
                        destination: destination.index,
                        courseId: props.course.id,
                      });
                    }}
                  >
                    <Droppable droppableId="dnd-list" direction="vertical">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {items}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <Alert icon={<IconInfoCircle />}>
                    Empty course. Click "Add new module" to add new module.
                  </Alert>
                )}
              </Box>
            </Stack>
          </Container>
        </Tabs.Panel>
        <Tabs.Panel value={tabs.resources.value}>
          <Stack spacing="xl">
            <Stack spacing="md">
              <Title order={5}>Course Resources:</Title>
              <Resources
                permissions={rabc.permissions}
                emptyMessage='There are no resources for this course. Click "Add new resource" to add new resource.'
                resourceFiles={props.course.resourceFiles}
              />
              <Group>
                <Anchor fw="bold" onClick={() => handleAttachmentUpload('resourceFile')}>
                  + Add new resource
                </Anchor>
              </Group>
            </Stack>
            <Stack spacing="md">
              <Title order={5}>Project Files:</Title>
              <ProjectFiles
                permissions={rabc.permissions}
                projectFiles={props.course.projectFiles}
                emptyMessage='There are no projects for this course. Click "Add new project file" to add new resource.'
              />
              <Group>
                <Anchor fw="bold" onClick={() => handleAttachmentUpload('projectFile')}>
                  + Add new project file
                </Anchor>
              </Group>
            </Stack>
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value={tabs.enrolledBy.value}>
          {viewAccessActivityHistory ? (
            <AccessActivityHistory
              close={() => setViewAccessActivityHistory(false)}
              courseId={props.course.id}
            />
          ) : (
            <>
              <EnrolledBy
                openAccessActivityHistory={() => setViewAccessActivityHistory(true)}
                courseId={props.course.id}
              />
              <Space h="xl" />
              <BulkEnrollment courseId={props.course.id} />
            </>
          )}
        </Tabs.Panel>
        <Tabs.Panel value={tabs.settings.value}>
          <Stack spacing="xl">
            <Group>
              <Button
                color="red"
                onClick={() => {
                  if (props.course.archived) {
                    return handleArchive();
                  }
                  return handleArchiveCourse();
                }}
                loading={deleteCourseMutation.isLoading || courseArchiveMutation.isLoading}
              >
                {props.course.archived ? 'Unarchive course' : 'Archive course'}
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    await checkAuthorizationForPage(context, [
      'read:courses',
      'update:courses',
      'create:courses',
    ] as Permission[]);
    const course = await getCourseDataForAdminPage(idSchema.parse(context.params?.courseId));
    return {
      props: {
        course,
      },
    };
  },
});

export default CourseAdminPage;
