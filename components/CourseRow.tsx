import { Button, Flex, Group, Paper, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import Image from 'next/image';
import {
  IconBook,
  IconVideo,
  IconArrowRight,
  IconArrowLeft,
  IconBrandZoom,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Course, CourseListItem } from '../types/courses';
import CourseMenu from './CourseMenu';
import { notify } from '../lib/notify';
import CourseMenuButtons from './CourseMenuButtons';

type CourseRowProps = {
  course: CourseListItem;
};

function CourseRow(props: CourseRowProps) {
  const theme = useMantineTheme();
  return (
    <Paper withBorder pr="md">
      <Flex justify="space-between" align="center">
        <Flex>
          <Image
            style={{
              borderRadius: `${theme.radius.sm} 0 0 ${theme.radius.sm}`,
            }}
            src={props.course.picture}
            alt={props.course.title}
            width={300}
            height={200}
          />
          <Stack pl="xl" justify="center">
            <Title order={4}>{props.course.title}</Title>
            <Text color="dimmed" lineClamp={5}>
              {props.course.description}
            </Text>
          </Stack>
        </Flex>
        <Stack>
          <CourseMenuButtons course={props.course} />
        </Stack>
      </Flex>
    </Paper>
  );
}

export default CourseRow;
