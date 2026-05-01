import {
  Anchor,
  Burger,
  Button,
  Center,
  Drawer,
  Group,
  Header,
  MediaQuery,
  Menu,
  Stack,
  Text,
  createStyles,
} from '@mantine/core';
import { IconExternalLink, IconLogout, IconUser, IconUserCog } from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';
import UserButton from './user-button';
import Logo from './Logo';
import { useUser } from '@auth0/nextjs-auth0/client';
import useRABC from '../hooks/useRABC';
import account from '../lib/data/account';

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing.xl,
    paddingRight: theme.spacing.xl,
    justifyContent: 'space-between',
    boxShadow: theme.colorScheme === 'dark' ? 'none' : theme.shadows.sm,
    backgroundColor: 'white',
  },
  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },
}));

function RootHeader() {
  const { classes } = useStyles();
  const [opened, { toggle }] = useDisclosure(false);
  const { user } = useUser();
  const rabc = useRABC();

  if (!user) return null;

  const links = (
    <Stack mt="md">
      <Button component={Link} href="/profile" leftIcon={<IconUser />}>
        Update Profile
      </Button>
      <Button variant="outline" leftIcon={<IconLogout />} component={Link} href="/api/auth/logout">
        Logout {user.name}
      </Button>
    </Stack>
  );

  return (
    <Header withBorder height={70} className={classes.wrapper}>
      <Logo />
      <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
        <Group spacing="lg">
          {account.connectLoginPage ? (
            <Anchor href={account.connectLoginPage} target="_blank">
              <Center>
                <Text component="span" pr="xs">
                  {account.name} Connect
                </Text>
                <IconExternalLink />
              </Center>
            </Anchor>
          ) : null}
          {rabc.check('view:admin_page') ? (
            <Button variant="light" leftIcon={<IconUserCog />} component={Link} href="/admin">
              Admin
            </Button>
          ) : null}
          <Menu trigger="hover">
            <Menu.Target>
              <UserButton avatar={user.picture} name={user.name || ''} email={user.email || ''} />
            </Menu.Target>
            <Menu.Dropdown bg="white">
              <Menu.Item component={Link} href="/profile" icon={<IconUser />}>
                Update Profile
              </Menu.Item>
              <Menu.Item icon={<IconLogout />} component={Link} href="/api/auth/logout">
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </MediaQuery>
      <Burger color="blue" opened={opened} onClick={toggle} className={classes.burger} size="sm" />
      <Drawer
        opened={opened}
        onClose={toggle}
        title="Menu"
        overlayProps={{ opacity: 0.5, blur: 4 }}
      >
        {links}
      </Drawer>
    </Header>
  );
}

export default RootHeader;
