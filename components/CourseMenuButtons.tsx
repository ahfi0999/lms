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
        leftIcon={<IconBrandZoom size="1rem" stroke={1.5} />}
        component={Link}
        variant="light"
        disabled={!props.course.liveLink}
      >
        Live Class
      </Button>
      <Button
        href={`${process.env.NEXT_PUBLIC_DOCS_SITE_URL}/${props.course.contentLink}`}
        leftIcon={<IconBook size="1rem" stroke={1.5} />}
        target="_blank"
        component={Link}
        disabled={!props.course.contentLink}
        variant="outline"
      >
        Documents
      </Button>
      <Button
        href={`/course/${props.course.id}`}
        leftIcon={<IconVideo size="1rem" stroke={1.5} />}
        component={Link}
      >
        Videos
      </Button>
    </>
  );
}

export default CourseMenuButtons;
