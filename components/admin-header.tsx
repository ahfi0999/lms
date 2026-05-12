import {
  Group,
  TextInput,
  ActionIcon,
  Avatar,
  Text,
  Box,
  Indicator,
  Menu,
  createStyles,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconMail,
  IconBell,
  IconChevronDown,
  IconUser,
  IconLogout,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

const useStyles = createStyles((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderBottom: `${rem(1)} solid ${theme.colors.gray[2]}`,
    padding: `0 ${theme.spacing.xl}`,
  },
  searchInput: {
    flex: 1,
    maxWidth: rem(420),
    '& input': {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.gray[6],
    },
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  kbdBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(2),
    padding: `${rem(2)} ${rem(6)}`,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray[1],
    fontSize: rem(11),
    color: theme.colors.gray[6],
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  iconBtn: {
    color: theme.colors.gray[6],
    '&:hover': {
      color: theme.colors.gray[9],
      backgroundColor: theme.colors.gray[0],
    },
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: rem(10),
    padding: `${rem(6)} ${rem(10)}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.gray[0],
    },
  },
  userName: {
    fontSize: theme.fontSizes.sm,
    fontWeight: 600,
    color: theme.colors.gray[9],
    lineHeight: 1.2,
  },
  userEmail: {
    fontSize: rem(11),
    color: theme.colors.gray[5],
    lineHeight: 1.2,
  },
}));

function AdminHeader() {
  const { classes } = useStyles();
  const { user } = useUser();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  return (
    <Box
      sx={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '0 24px',
      }}
    >
      <Group position="apart" w="100%" spacing="md">
        {/* Search */}
        <TextInput
          className={classes.searchInput}
          placeholder="Search learners, courses, enrollments..."
          icon={<IconSearch size={15} color="gray" />}
          rightSection={
            <Box className={classes.kbdBadge}>
              <Text>Ctrl</Text>
              <Text>+</Text>
              <Text>K</Text>
            </Box>
          }
          rightSectionWidth={80}
          styles={{
            input: {
              border: `${rem(1)} solid #e9ecef`,
              borderRadius: 8,
              fontSize: 13,
              '&::placeholder': { color: '#adb5bd' },
            },
          }}
        />

        {/* Right side */}
        <Group spacing="xs" noWrap>
          <ActionIcon className={classes.iconBtn} size={36} radius="md" variant="subtle">
            <IconMail size={20} />
          </ActionIcon>

          <Indicator label="8" size={16} color="red" offset={4}>
            <ActionIcon className={classes.iconBtn} size={36} radius="md" variant="subtle">
              <IconBell size={20} />
            </ActionIcon>
          </Indicator>

          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <Box className={classes.userBox}>
                <Avatar
                  src={user?.picture}
                  radius="xl"
                  size={36}
                  color="blue"
                >
                  {initials}
                </Avatar>
                <Box>
                  <Text className={classes.userName}>{user?.name || 'Admin'}</Text>
                  <Text className={classes.userEmail}>{user?.email || 'admin@mail.com'}</Text>
                </Box>
                <IconChevronDown size={14} color="#868e96" style={{ marginLeft: 2 }} />
              </Box>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} href="/profile" icon={<IconUser size={14} />}>
                Update Profile
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                component={Link}
                href="/api/auth/logout"
                icon={<IconLogout size={14} />}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}

export default AdminHeader;
