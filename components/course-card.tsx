import {
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Text,
  Title,
  useMantineTheme,
  Menu,
  ActionIcon,
} from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import { CourseListItem } from '../types/courses';
import CourseMenu from './CourseMenu';
import CourseMenuButtons from './CourseMenuButtons';

type CourseCardProps = {
  course: CourseListItem;
};

function CourseCard(props: CourseCardProps) {
  const { course } = props;
  const theme = useMantineTheme();

  return (
    <Paper component={Flex} display="flex" withBorder mb="xl" direction="column">
      <Box pos="relative" h={300}>
        <Image
          fill
          style={{
            borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
          }}
          src={course.picture}
          alt={course.title}
        />
      </Box>
      <Flex h={300} direction="column" gap="xl" p="xl" pt={0} justify="space-between">
        <Title align="center" order={4} mt="xl">
          {course.title}
        </Title>
        <Text color="dimmed" lineClamp={5}>
          {course.description}
        </Text>
        <Group position="apart">
          <CourseMenuButtons course={props.course} />
        </Group>
      </Flex>
    </Paper>
  );
}

export default CourseCard;
