import { Menu, Button, useMantineTheme } from '@mantine/core';
import { IconChevronDown, IconVideo, IconBook, IconBrandZoom } from '@tabler/icons-react';
import Link from 'next/link';
import theme from '../theme';
import { CourseListItem } from '../types/courses';

type CourseMenuProps = {
  course: CourseListItem;
};

function CourseMenu(props: CourseMenuProps) {
  const theme = useMantineTheme();
  const { course } = props;
  return (
    <Menu width={220} withinPortal>
      <Menu.Target>
        <Button rightIcon={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>
          Menu
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          href={`/course/${course.id}`}
          icon={<IconVideo size="1rem" color={theme.colors.orange[6]} stroke={1.5} />}
          component={Link}
        >
          View
        </Menu.Item>
        {course.contentLink ? (
          <Menu.Item
            href={course.contentLink || '#'}
            icon={<IconBook size="1rem" color={theme.colors.blue[6]} stroke={1.5} />}
            component={Link}
          >
            Notes
          </Menu.Item>
        ) : null}
        {course.liveLink ? (
          <Menu.Item
            href={course.liveLink || '#'}
            target="_blank"
            icon={<IconBrandZoom size="1rem" color={theme.colors.green[6]} stroke={1.5} />}
            component={Link}
          >
            Live Class
          </Menu.Item>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}

export default CourseMenu;
