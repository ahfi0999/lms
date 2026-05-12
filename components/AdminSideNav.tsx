import { useState } from 'react';
import {
  ScrollArea,
  createStyles,
  Text,
  Box,
  UnstyledButton,
  Collapse,
  Tooltip,
  rem,
  Indicator,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconBook2,
  IconUsers,
  IconStack2,
  IconCertificate,
  IconMail,
  IconTemplate,
  IconMailbox,
  IconSpeakerphone,
  IconRefreshAlert,
  IconDatabase,
  IconUserShield,
  IconSettings,
  IconFileAnalytics,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from './Logo';

const EXPANDED_W = 260;
const COLLAPSED_W = 72;

const useStyles = createStyles((theme) => ({
  sectionLabel: {
    fontSize: rem(10),
    fontWeight: 700,
    letterSpacing: rem(1),
    color: theme.colors.gray[5],
    textTransform: 'uppercase' as const,
    marginBottom: theme.spacing.xs,
    paddingLeft: rem(8),
    whiteSpace: 'nowrap' as const,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${rem(8)} ${rem(8)}`,
    borderRadius: theme.radius.md,
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    color: theme.colors.gray[7],
    cursor: 'pointer',
    marginBottom: rem(2),
    whiteSpace: 'nowrap' as const,
    '&:hover': {
      backgroundColor: theme.colors.gray[0],
      color: theme.colors.gray[9],
    },
  },
  navItemActive: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[7],
    fontWeight: 600,
    '&:hover': {
      backgroundColor: theme.colors.blue[0],
      color: theme.colors.blue[7],
    },
  },
  subItem: {
    display: 'block',
    width: '100%',
    padding: `${rem(7)} ${rem(8)} ${rem(7)} ${rem(38)}`,
    borderRadius: theme.radius.md,
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    color: theme.colors.gray[6],
    textDecoration: 'none',
    marginBottom: rem(2),
    whiteSpace: 'nowrap' as const,
    '&:hover': {
      backgroundColor: theme.colors.gray[0],
      color: theme.colors.gray[9],
    },
  },
  subItemActive: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[7],
    fontWeight: 600,
  },
  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${rem(8)} ${rem(8)}`,
    borderRadius: theme.radius.md,
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    color: theme.colors.gray[6],
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    '&:hover': {
      backgroundColor: theme.colors.gray[0],
      color: theme.colors.gray[8],
    },
  },
}));

type NavItemDef = {
  label: string;
  icon: React.FC<any>;
  href?: string;
  sub?: { label: string; href: string }[];
  dot?: boolean;
};

type NavSection = {
  label: string;
  items: NavItemDef[];
};

const sections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: IconLayoutDashboard, href: '/admin' },
      { label: 'Courses', icon: IconBook2, href: '/admin/courses' },
      {
        label: 'Learners',
        icon: IconUsers,
        sub: [{ label: 'All Learners', href: '/admin/learners/manage-user' }],
      },
      { label: 'Batch Management', icon: IconStack2, href: '/admin/batch-management' },
      { label: 'Certificates', icon: IconCertificate, href: '/admin/certificates' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Email Center', icon: IconMail, href: '/admin/email-center' },
      { label: 'Templates', icon: IconTemplate, href: '/admin/templates' },
      { label: 'Email Logs', icon: IconMailbox, href: '/admin/email-logs' },
      { label: 'Announcements', icon: IconSpeakerphone, href: '/admin/announcements' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Freshworks CRM', icon: IconRefreshAlert, href: '/admin/freshworks-crm', dot: true },
      { label: 'Sync Logs', icon: IconDatabase, href: '/admin/sync-logs' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Users & Roles', icon: IconUserShield, href: '/admin/users-roles' },
      { label: 'Settings', icon: IconSettings, href: '/admin/settings' },
      { label: 'Audit Logs', icon: IconFileAnalytics, href: '/admin/audit-logs' },
    ],
  },
];

function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  const { classes, cx } = useStyles();
  const router = useRouter();
  const [open, setOpen] = useState(
    item.sub?.some((s) => router.pathname === s.href) ?? false
  );

  const isActive = item.href ? router.pathname === item.href : false;
  const hasSub = Array.isArray(item.sub) && item.sub.length > 0;

  const iconEl = item.dot ? (
    <Indicator color="green" size={7} offset={-1} zIndex={1}>
      <item.icon size={18} stroke={1.8} />
    </Indicator>
  ) : (
    <item.icon size={18} stroke={1.8} />
  );

  if (hasSub) {
    return (
      <>
        <Tooltip label={item.label} position="right" disabled={!collapsed} withArrow withinPortal>
          <UnstyledButton
            className={cx(classes.navItem, { [classes.navItemActive]: isActive })}
            onClick={() => !collapsed && setOpen((o) => !o)}
            sx={collapsed ? { justifyContent: 'center', padding: `${rem(8)} 0` } : undefined}
          >
            {/* icon — always visible */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: rem(22),
                flexShrink: 0,
              }}
            >
              {iconEl}
            </Box>
            {/* label + chevron — hidden when collapsed */}
            {!collapsed && (
              <>
                <Text size="sm" ml={10} sx={{ flex: 1 }}>
                  {item.label}
                </Text>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 4 }}>
                  {open ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                </Box>
              </>
            )}
          </UnstyledButton>
        </Tooltip>
        {!collapsed && (
          <Collapse in={open}>
            {item.sub!.map((s) => {
              const subActive = router.pathname === s.href;
              return (
                <Text
                  component={Link}
                  href={s.href}
                  key={s.href}
                  className={cx(classes.subItem, { [classes.subItemActive]: subActive })}
                >
                  {s.label}
                </Text>
              );
            })}
          </Collapse>
        )}
      </>
    );
  }

  return (
    <Tooltip label={item.label} position="right" disabled={!collapsed} withArrow withinPortal>
      <UnstyledButton
        component={Link}
        href={item.href!}
        className={cx(classes.navItem, { [classes.navItemActive]: isActive })}
        sx={collapsed ? { justifyContent: 'center', padding: `${rem(8)} 0` } : undefined}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: rem(22),
            flexShrink: 0,
          }}
        >
          {iconEl}
        </Box>
        {!collapsed && (
          <Text size="sm" ml={10}>
            {item.label}
          </Text>
        )}
      </UnstyledButton>
    </Tooltip>
  );
}

type AdminSideNavProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function AdminSideNav({ collapsed, onToggle }: AdminSideNavProps) {
  const { classes, cx } = useStyles();

  return (
    <Box
      sx={{
        width: collapsed ? COLLAPSED_W : EXPANDED_W,
        minWidth: collapsed ? COLLAPSED_W : EXPANDED_W,
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 180ms ease, min-width 180ms ease',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Logo row — matches header height */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 12px',
          borderBottom: '1px solid #e9ecef',
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: collapsed ? 48 : 160, overflow: 'hidden', flexShrink: 0 }}>
          <Logo width={160} height={48} />
        </Box>
      </Box>

      {/* Scrollable nav sections */}
      <ScrollArea sx={{ flex: 1 }} type="never" px="xs" py="xs">
        {sections.map((section) => (
          <Box key={section.label} mb="sm">
            {!collapsed && (
              <Text className={classes.sectionLabel}>{section.label}</Text>
            )}
            {collapsed && <Box mb={rem(4)} />}
            {section.items.map((item) => (
              <NavItem key={item.label} item={item} collapsed={collapsed} />
            ))}
          </Box>
        ))}
      </ScrollArea>

      {/* Collapse / expand button */}
      <Box
        sx={{
          borderTop: '1px solid #e9ecef',
          padding: '8px',
          flexShrink: 0,
        }}
      >
        <Tooltip label="Expand" position="right" disabled={!collapsed} withArrow withinPortal>
          <UnstyledButton
            className={classes.collapseBtn}
            onClick={onToggle}
            sx={collapsed ? { justifyContent: 'center', padding: `${rem(8)} 0` } : undefined}
          >
            {collapsed ? (
              <IconChevronRight size={18} />
            ) : (
              <>
                <IconChevronLeft size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                Collapse
              </>
            )}
          </UnstyledButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default AdminSideNav;
