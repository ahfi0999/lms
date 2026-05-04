import { Button } from '@mantine/core';
import { IconVideo, IconBook, IconBrandZoom } from '@tabler/icons-react';
import Link from 'next/link';
import { notify } from '../lib/notify';
import { CourseListItem } from '../types/courses';

type CourseMenuButtonsProps = {
  course: CourseListItem;
};

function CourseMenuButtons(props: CourseMenuButtonsProps) {
  return (
    <>
      <Button
        href={props.course.liveLink || '#'}
        target="_blank"
        leftIcon={<IconBrandZoom size={14} stroke={1.5} />}
        component={Link}
        variant="light"
        size="xs"
        px={8}
        disabled={!props.course.liveLink}
      >
        Live Class
      </Button>
      <Button
        href={`${process.env.NEXT_PUBLIC_DOCS_SITE_URL}/${props.course.contentLink}`}
        leftIcon={<IconBook size={14} stroke={1.5} />}
        target="_blank"
        component={Link}
        disabled={!props.course.contentLink}
        variant="outline"
        size="xs"
        px={8}
      >
        Documents
      </Button>
      <Button
        href={`/course/${props.course.id}`}
        leftIcon={<IconVideo size={14} stroke={1.5} />}
        component={Link}
        size="xs"
        px={8}
      >
        Videos
      </Button>
    </>
  );
}

export default CourseMenuButtons;
