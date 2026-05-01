import { Alert, Anchor, Container, List, Stack, Text, Timeline, Tooltip } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import useGetAppEvents from '../hooks/useGetAppEvents';
import { CourseAccessEvent } from '../types/app-events';
import { formatDateWithTime } from '../lib/dates';
import { listFormatter } from '../lib/utils';
import AccessActivityHistoryLayout from './AccessActivityHistoryLayout';
import Link from 'next/link';

type AccessActivityHistoryProps = {
  courseId: number;
  close: () => void;
};

function AccessActivityHistory(props: AccessActivityHistoryProps) {
  const query = useGetAppEvents<CourseAccessEvent>({
    courseId: props.courseId,
    type: 'COURSE_ACCESS',
  });

  if (query.status === 'loading') {
    return null;
  }

  if (query.status === 'error') {
    return <Alert color="red">Something went wrong</Alert>;
  }

  if (query.data.length === 0) {
    return (
      <AccessActivityHistoryLayout close={props.close}>
        <Alert color="info">No access activity found</Alert>
      </AccessActivityHistoryLayout>
    );
  }

  return (
    <AccessActivityHistoryLayout close={props.close}>
      <Timeline active={Infinity} bulletSize="1rem">
        {query.data.map((event) => {
          if (event.data.action === 'enroll') {
            return (
              <Timeline.Item
                key={event.id}
                title={
                  <Stack spacing={0}>
                    <Text>
                      <Tooltip label={event.user.email}>
                        <Text component="span" fw="bold">
                          {event.user.name}
                        </Text>
                      </Tooltip>{' '}
                      added below students to the course
                    </Text>
                    <Text size="sm" color="dimmed">
                      {formatDateWithTime(event.createdAt)}
                    </Text>
                  </Stack>
                }
              >
                <List
                  type="unordered"
                  icon={<IconUser size="0.7rem" />}
                  spacing="xs"
                  mt="md"
                  withPadding
                >
                  {event.data.students.map((student) => (
                    <List.Item key={student}>
                      <Anchor
                        component={Link}
                        href={`/admin/learners/manage-user?email=${encodeURIComponent(student)}`}
                      >
                        {student}
                      </Anchor>
                    </List.Item>
                  ))}
                </List>
              </Timeline.Item>
            );
          }

          if (event.data.action === 'unenroll') {
            return (
              <Timeline.Item
                key={event.id}
                title={
                  <Stack spacing={0}>
                    <Text>
                      <Tooltip label={event.user.email}>
                        <Text component="span" fw="bold">
                          {event.user.name}
                        </Text>
                      </Tooltip>{' '}
                      unenrolled{' '}
                      <Text fw="bold" component="span">
                        {listFormatter(event.data.students)}
                      </Text>
                    </Text>
                    <Text size="sm" color="dimmed">
                      {formatDateWithTime(event.createdAt)}
                    </Text>
                  </Stack>
                }
              />
            );
          }

          return null;
        })}
      </Timeline>
    </AccessActivityHistoryLayout>
  );
}

export default AccessActivityHistory;
