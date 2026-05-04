import { forwardRef } from 'react';
import { Group, Avatar, Text, UnstyledButton, createStyles, rem } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Nullable } from '../types/utils';

interface UserButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  avatar: Nullable<string>;
  name: string;
  email: string;
}

const AVATAR_GRADIENTS = [
  { from: 'indigo', to: 'cyan' },
  { from: 'teal', to: 'lime' },
  { from: 'orange', to: 'red' },
  { from: 'grape', to: 'pink' },
  { from: 'blue', to: 'violet' },
] as const;

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string, email: string) {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const useStyles = createStyles((theme) => ({
  wrapper: {
    paddingInline: theme.spacing.sm,
    paddingBlock: rem(6),
    borderRadius: theme.radius.md,
    border: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]
    }`,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
    transition: 'all 150ms ease',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    '&:hover': {
      borderColor: theme.colors.blue[5],
      boxShadow: theme.shadows.sm,
      transform: 'translateY(-1px)',
    },
  },
  name: {
    lineHeight: 1.2,
  },
  email: {
    lineHeight: 1.2,
  },
  chevron: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[5],
  },
}));

// eslint-disable-next-line react/display-name
const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ avatar, name, email, color, ...others }: UserButtonProps, ref) => {
    const { classes } = useStyles();
    const gradient = pickGradient(email || name || '');
    const initials = getInitials(name, email);

    return (
      <UnstyledButton ref={ref} {...others} className={classes.wrapper}>
        <Group spacing="sm" noWrap>
          <Avatar
            src={avatar || undefined}
            radius="xl"
            size={36}
            variant="gradient"
            gradient={gradient}
          >
            {initials}
          </Avatar>

          <div style={{ minWidth: 0 }}>
            <Text size="sm" weight={600} className={classes.name} truncate>
              {name || email.split('@')[0]}
            </Text>
            <Text color="dimmed" size="xs" className={classes.email} truncate>
              {email}
            </Text>
          </div>

          <IconChevronDown size={16} stroke={1.5} className={classes.chevron} />
        </Group>
      </UnstyledButton>
    );
  }
);

export default UserButton;
