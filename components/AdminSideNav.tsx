import { Navbar, Group, ScrollArea, createStyles, rem } from '@mantine/core';
import { IconPresentationAnalytics, IconTools, IconUsers, IconVideo } from '@tabler/icons-react';
import Logo from './Logo';
import { LinksGroup } from './NavbarLinksGroup';

const adminLinks = [
  { label: 'Dashboard', icon: IconPresentationAnalytics, link: '/' },
  { label: 'Courses', icon: IconVideo, link: '/courses' },
  {
    label: 'Users',
    icon: IconUsers,
    initiallyOpened: true,
    links: [
      {
        label: 'Import Users',
        link: '/learners/import-users',
      },
      {
        label: 'Manage User',
        link: '/learners/manage-user',
      },
    ],
  },
  {
    label: 'Others',
    icon: IconTools,
    initiallyOpened: true,
    links: [{ label: 'File Upload', link: '/upload-file' }],
  },
];

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
    paddingBottom: 0,
  },

  header: {
    padding: theme.spacing.md,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
  },

  links: {
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
  },

  linksInner: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },

  footer: {
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
  },
}));

function AdminSideNav() {
  const { classes } = useStyles();
  const links = adminLinks.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <Navbar height={800} width={{ sm: 300 }} p="md" className={classes.navbar}>
      <Navbar.Section className={classes.header}>
        <Group position="apart">
          <Logo width={200} height={60} />
        </Group>
      </Navbar.Section>

      <Navbar.Section grow className={classes.links} component={ScrollArea}>
        <div className={classes.linksInner}>{links}</div>
      </Navbar.Section>
    </Navbar>
  );
}

export default AdminSideNav;
