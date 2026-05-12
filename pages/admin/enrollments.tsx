import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { GetServerSidePropsContext } from 'next';
import { checkAuthorizationForPage } from '../../lib/auth-utils';
import db from '../../lib/db';
import AdminLayout from '../../layouts/admin-layout';
import BulkEnrollment from '../../components/BulkEnrollment';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Select,
  Paper,
  Badge,
  Modal,
  Table,
  Avatar,
  createStyles,
  rem,
  Divider,
} from '@mantine/core';
import {
  IconUserPlus,
  IconBook2,
  IconUsers,
  IconChevronRight,
} from '@tabler/icons-react';

type Course = {
  id: number;
  title: string;
  enrolledCount: number;
};

type Props = {
  courses: Course[];
};

const useStyles = createStyles((theme) => ({
  courseRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[1]}`,
    '&:last-child': { borderBottom: 'none' },
    '&:hover': { backgroundColor: theme.colors.gray[0] },
  },
  card: {
    backgroundColor: theme.white,
    border: `${rem(1)} solid ${theme.colors.gray[2]}`,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
  },
  modalSelect: {
    marginBottom: theme.spacing.lg,
  },
}));

export default function EnrollmentsPage({ courses }: Props) {
  const { classes } = useStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));

  const openEnrollModal = (courseId?: number) => {
    if (courseId) setSelectedCourseId(String(courseId));
    setModalOpen(true);
  };

  const courseOptions = courses.map((c) => ({
    value: String(c.id),
    label: c.title,
  }));

  return (
    <AdminLayout>
      {/* Page header */}
      <Group position="apart" mb="xl">
        <Box>
          <Title order={3} weight={700}>Enrollments</Title>
          <Text size="sm" color="dimmed" mt={4}>
            Manage course enrollments — add learners to any course.
          </Text>
        </Box>
        <Button
          leftIcon={<IconUserPlus size={16} />}
          onClick={() => openEnrollModal()}
        >
          Add Users
        </Button>
      </Group>

      {/* Courses list */}
      <Box className={classes.card}>
        <Box className={classes.cardHeader}>
          <Group>
            <IconBook2 size={18} color="#868e96" />
            <Text weight={600} size="sm">
              Courses ({courses.length})
            </Text>
          </Group>
        </Box>

        {courses.length === 0 ? (
          <Box p="xl" sx={{ textAlign: 'center' }}>
            <Text color="dimmed" size="sm">No courses found.</Text>
          </Box>
        ) : (
          courses.map((course) => (
            <Box key={course.id} className={classes.courseRow}>
              <Group spacing="md">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconBook2 size={20} color="#1976d2" stroke={1.8} />
                </Box>
                <Box>
                  <Text size="sm" weight={600}>{course.title}</Text>
                  <Group spacing={4} mt={2}>
                    <IconUsers size={12} color="#868e96" />
                    <Text size={11} color="dimmed">
                      {course.enrolledCount} enrolled
                    </Text>
                  </Group>
                </Box>
              </Group>

              <Button
                size="xs"
                variant="light"
                color="blue"
                leftIcon={<IconUserPlus size={13} />}
                onClick={() => openEnrollModal(course.id)}
              >
                Add Users
              </Button>
            </Box>
          ))
        )}
      </Box>

      {/* Enroll modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCourseId(null);
        }}
        title={
          <Group spacing="xs">
            <IconUserPlus size={18} color="#1971c2" />
            <Text weight={600}>Enroll Users</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Select
          label="Select Course"
          placeholder="Pick a course..."
          data={courseOptions}
          value={selectedCourseId}
          onChange={setSelectedCourseId}
          searchable
          className={classes.modalSelect}
          icon={<IconBook2 size={14} />}
        />

        {selectedCourse && (
          <Box
            sx={{
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text size="sm" weight={500} color="blue">
              Enrolling into: {selectedCourse.title}
            </Text>
            <Text size={11} color="dimmed">
              {selectedCourse.enrolledCount} learners already enrolled
            </Text>
          </Box>
        )}

        {selectedCourseId ? (
          <BulkEnrollment courseId={Number(selectedCourseId)} />
        ) : (
          <Text size="sm" color="dimmed" align="center" py="md">
            Select a course above to start enrolling users.
          </Text>
        )}
      </Modal>
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
