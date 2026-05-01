import { Anchor, Breadcrumbs, Header, Stack, Title, createStyles } from '@mantine/core';
import Link from 'next/link';

type AdminHeaderProps = {
  title: string;
  breadcrumbs: { title: string; href: string }[];
};

const useStyles = createStyles((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
  },
}));

function AdminHeader(props: AdminHeaderProps) {
  const { classes } = useStyles();
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
    </Header>
  );
}

export default AdminHeader;
