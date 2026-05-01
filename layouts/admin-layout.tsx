import { AppShell, Box, Title } from '@mantine/core';
import AdminHeader from '../components/admin-header';
import useRABC from '../hooks/useRABC';
import { useRouter } from 'next/router';
import { notify } from '../lib/notify';
import { useEffect } from 'react';
import AdminSideNav from '../components/AdminSideNav';

type AdminLayoutProps = {
  children: React.ReactNode;
  title: string;
  breadcrumbs: { title: string; href: string }[];
};

function AdminLayout(props: AdminLayoutProps) {
  const rabc = useRABC();
  const router = useRouter();

  useEffect(() => {
    if (!rabc.check('view:admin_page') && rabc.isSuccess) {
      notify({
        title: 'Access Denied',
        message: 'You do not have access to this page',
        type: 'error',
      });
      router.push('/dashboard');
    }
  }, []);

  return (
    <AppShell
      aside={<AdminSideNav />}
      layout="alt"
      header={<AdminHeader title={props.title} breadcrumbs={props.breadcrumbs} />}
    >
      <Box>{props.children}</Box>
    </AppShell>
  );
}

export default AdminLayout;
