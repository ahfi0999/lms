import { Box, Center, Flex, Group, Paper, Title } from '@mantine/core';
import { IconBook2 } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import { CourseListItem } from '../types/courses';
import CourseMenuButtons from './CourseMenuButtons';

type CourseCardProps = {
  course: CourseListItem;
};

function CourseCard(props: CourseCardProps) {
  const { course } = props;
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(course.picture) && !imageFailed;

  return (
    <Paper
      component={Flex}
      display="flex"
      withBorder
      mb="xl"
      direction="column"
      shadow="sm"
      radius="md"
      sx={(theme) => ({
        overflow: 'hidden',
        height: '100%',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows.md,
          borderColor: theme.colors.blue[4],
        },
        '&:hover .course-card-image': {
          transform: 'scale(1.04)',
        },
      })}
    >
      <Box
        pos="relative"
        h={180}
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <Box
            className="course-card-image"
            sx={{
              position: 'absolute',
              inset: 0,
              transition: 'transform 400ms ease',
            }}
          >
            <Image
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              src={course.picture}
              alt={course.title}
              sizes="(max-width: 768px) 100vw, 25vw"
              quality={90}
              onError={() => setImageFailed(true)}
            />
          </Box>
        ) : (
          <Center h="100%" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <IconBook2 size={64} stroke={1.25} />
          </Center>
        )}
      </Box>
      <Flex direction="column" gap="md" p="md" justify="space-between" sx={{ flex: 1 }}>
        <Title order={4} lineClamp={2}>
          {course.title}
        </Title>
        <Group spacing={6} grow noWrap>
          <CourseMenuButtons course={props.course} />
        </Group>
      </Flex>
    </Paper>
  );
}

export default CourseCard;
