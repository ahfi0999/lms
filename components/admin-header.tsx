import {
  Anchor,
  Breadcrumbs,
  Group,
  Header,
  Menu,
  Stack,
  Title,
  createStyles,
} from '@mantine/core';
import { IconCertificate, IconLogout, IconUser } from '@tabler/icons-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import UserButton from './user-button';

type AdminHeaderProps = {
  title: string;
  breadcrumbs: { title: string; href: string }[];
};

const useStyles = createStyles(() => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
      <Stack spacing={4}>
        <Title p={0} m={0} order={3}>
          {props.title}
        </Title>
        <Breadcrumbs>{items}</Breadcrumbs>
      </Stack>
      {user ? (
        <Group>
          <Menu trigger="hover" position="bottom-end" withinPortal>
            <Menu.Target>
              <UserButton avatar={user.picture} name={user.name || ''} email={user.email || ''} />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} href="/profile" icon={<IconUser size={16} />}>
                Update Profile
              </Menu.Item>
              <Menu.Item
                component={Link}
                href="/certificate-request"
                icon={<IconCertificate size={16} />}
              >
                Certificate Request
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                component={Link}
                href="/api/auth/logout"
                icon={<IconLogout size={16} />}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      ) : null}
    </Header>
  );
}

export default AdminHeader;
