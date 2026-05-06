import { useState } from 'react';
import { Group, Box, Collapse, Text, UnstyledButton, createStyles, rem, clsx } from '@mantine/core';
import { IconCalendarStats, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const useStyles = createStyles((theme) => ({
  control: {
    fontWeight: 500,
    display: 'block',
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[8], // Darker text
    fontSize: theme.fontSizes.sm,
    borderRadius: theme.radius.lg,
    position: 'relative',
    marginBottom: rem(4),

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
    },
  },

  active: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.blue[0],
    color: theme.colors.blue[7],
    boxShadow: theme.colorScheme === 'dark' ? 'none' : `0 4px 15px rgba(0, 0, 0, 0.05)`, // Subtle shadow

    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: rem(5), // Slightly thicker
      backgroundColor: theme.colors.blue[6],
      borderRadius: `0 ${theme.radius.sm} ${theme.radius.sm} 0`,
    },

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.blue[0],
    },
  },

  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: rem(36),
    height: rem(36),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1],
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[7], // Darker icon
  },

  iconBoxActive: {
    backgroundColor: theme.colorScheme === 'dark' ? 'transparent' : theme.white, // Pop out slightly
    color: theme.colors.blue[7],
    boxShadow: theme.colorScheme === 'dark' ? 'none' : `0 2px 8px rgba(0,0,0,0.05)`,
  },

  linkWrapper: {
    position: 'relative',
    marginLeft: rem(34),
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,

    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: rem(2), // Thicker line so it's visible
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2],
    },
  },

  link: {
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    fontSize: theme.fontSizes.sm,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[8], // Darker text
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
    border: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3]
    }`, // Darker border
    borderRadius: theme.radius.md,
    marginLeft: rem(20),
    marginBottom: theme.spacing.xs,
    position: 'relative',

    '&::before': {
      content: '""',
      position: 'absolute',
      left: rem(-23), // -20 margin + -3 (half of 6px width + 1px for 2px line)
      top: '50%',
      transform: 'translateY(-50%)',
      width: rem(6),
      height: rem(6),
      borderRadius: '50%',
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[4],
      zIndex: 2,
    },

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
    },
  },

  linkActive: {
    fontWeight: 600,
    color: theme.colors.blue[7],
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0],
    border: `1px solid transparent`,
    boxShadow: `0 2px 8px ${theme.colors.blue[1]}`,

    '&::before': {
      backgroundColor: theme.colors.blue[6],
      width: rem(8),
      height: rem(8),
      left: rem(-24),
    },

    '&::after': {
      content: '""',
      position: 'absolute',
      left: rem(-20),
      top: '50%',
      transform: 'translateY(-50%)',
      width: rem(20),
      height: '100%',
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0],
      borderTopLeftRadius: theme.radius.xl,
      borderBottomLeftRadius: theme.radius.xl,
      zIndex: -1,
    },
  },

  chevron: {
    transition: 'transform 200ms ease',
  },
}));

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  link?: string;
  absolute?: boolean;
}

export function LinksGroup({
  icon: Icon,
  label,
  initiallyOpened,
  links,
  link,
  absolute,
}: LinksGroupProps) {
  const { classes, theme } = useStyles();
  const router = useRouter();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);
  const ChevronIcon = theme.dir === 'ltr' ? IconChevronRight : IconChevronLeft;
  const resolveHref = (path: string) => (absolute ? path : `/admin${path}`);

  const items = (hasLinks ? links : []).map((linkItem) => {
    const isActive = router.pathname === resolveHref(linkItem.link);
    return (
      <Text
        component={Link}
        className={clsx(classes.link, { [classes.linkActive]: isActive })}
        href={resolveHref(linkItem.link)}
        key={linkItem.label}
      >
        {linkItem.label}
      </Text>
    );
  });

  if (link) {
    const isActive = router.pathname === resolveHref(link);
    return (
      <UnstyledButton
        component={Link}
        href={resolveHref(link)}
        className={clsx(classes.control, { [classes.active]: isActive })}
      >
        <Group position="apart" spacing={0}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box className={clsx(classes.iconBox, { [classes.iconBoxActive]: isActive })}>
              <Icon size="1.2rem" stroke={1.5} />
            </Box>
            <Box ml="md">{label}</Box>
          </Box>
        </Group>
      </UnstyledButton>
    );
  }

  return (
    <>
      <UnstyledButton onClick={() => setOpened((o) => !o)} className={classes.control}>
        <Group position="apart" spacing={0}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box className={classes.iconBox}>
              <Icon size="1.2rem" stroke={1.5} />
            </Box>
            <Box ml="md">{label}</Box>
          </Box>
          {hasLinks && (
            <ChevronIcon
              className={classes.chevron}
              size="1rem"
              stroke={1.5}
              style={{
                transform: opened ? `rotate(${theme.dir === 'rtl' ? -90 : 90}deg)` : 'none',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? (
        <Collapse in={opened}>
          <Box className={classes.linkWrapper}>{items}</Box>
        </Collapse>
      ) : null}
    </>
  );
}
