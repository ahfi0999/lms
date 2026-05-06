import {
  Anchor,
  Breadcrumbs,
  Header,
  Stack,
  Title,
  createStyles,
  Group,
  Menu,
  Button,
} from '@mantine/core';
import { IconCertificate, IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import UserButton from './user-button';

type AdminHeaderProps = {
  title: string;
  breadcrumbs: { title: string; href: string }[];
};

const useStyles = createStyles((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminBadge: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[7],
    fontWeight: 600,
    '&:hover': {
      backgroundColor: theme.colors.blue[1],
    },
  },
}));

function AdminHeader(props: AdminHeaderProps) {
  const { classes } = useStyles();
  const { user } = useUser();
  const items = props.breadcrumbs.map((item, index) => (
    <Anchor href={item.href} component={Link} key={index}>
      {item.title}
    </Anchor>
  ));
  return (
    <Header height={80} withBorder p="md" className={classes.header}>
      <Group position="apart" w="100%">
        <Stack spacing={4}>
          <Title p={0} m={0} order={3}>
            {props.title}
          </Title>
          <Breadcrumbs>{items}</Breadcrumbs>
        </Stack>
        {user ? (
          <Group spacing="lg">
            <Button
              component={Link}
              href="/admin/courses"
              className={classes.adminBadge}
              radius="xl"
              size="md"
              leftIcon={<IconSettings size={20} />}
            >
              Admin
            </Button>
            <Menu trigger="hover" position="bottom-end" withinPortal>
              <Menu.Target>
                <UserButton avatar={user.picture} name={user.name || ''} email={user.email || ''} />
              </Menu.Target>
              <Menu.Dropdown bg="white">
                <Menu.Item component={Link} href="/profile" icon={<IconUser size={16} />}>
                  Update Profile
                </Menu.Item>

                <Menu.Item
                  icon={<IconLogout size={16} />}
                  color="red"
                  component={Link}
                  href="/api/auth/logout"
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ) : null}
      </Group>
    </Header>
  );
}

export default AdminHeader;
