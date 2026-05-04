import {
  ActionIcon,
  Burger,
  Button,
  Drawer,
  Group,
  Header,
  MediaQuery,
  Menu,
  Stack,
  Tooltip,
  createStyles,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconCertificate,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
  IconUserCog,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';
import UserButton from './user-button';
import Logo from './Logo';
import { useUser } from '@auth0/nextjs-auth0/client';
import useRABC from '../hooks/useRABC';

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing.xl,
    paddingRight: theme.spacing.xl,
    justifyContent: 'space-between',
    boxShadow: theme.colorScheme === 'dark' ? 'none' : theme.shadows.sm,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
  },
  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },
}));

function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <Tooltip label={dark ? 'Switch to light mode' : 'Switch to dark mode'} withArrow>
      <ActionIcon
        size="lg"
        radius="md"
        variant="light"
        color={dark ? 'yellow' : 'blue'}
        onClick={() => toggleColorScheme()}
        aria-label="Toggle color scheme"
      >
        {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}

function RootHeader() {
  const { classes } = useStyles();
  const [opened, { toggle }] = useDisclosure(false);
  const { user } = useUser();
  const rabc = useRABC();

  if (!user) return null;

  const links = (
    <Stack mt="md">
      <Group position="center">
        <ColorSchemeToggle />
      </Group>
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
        <Group spacing="md">
          <ColorSchemeToggle />
          {rabc.check('view:admin_page') ? (
            <Button variant="light" leftIcon={<IconUserCog />} component={Link} href="/admin">
              Admin
            </Button>
          ) : null}
          <Menu trigger="hover">
            <Menu.Target>
              <UserButton avatar={user.picture} name={user.name || ''} email={user.email || ''} />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} href="/profile" icon={<IconUser />}>
                Update Profile
              </Menu.Item>
              <Menu.Item component={Link} href="/certificate-request" icon={<IconCertificate />}>
                Certificate Request
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item icon={<IconLogout />} component={Link} href="/api/auth/logout" color="red">
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
