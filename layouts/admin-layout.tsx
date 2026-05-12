import { useState } from 'react';
import { Box } from '@mantine/core';
import AdminHeader from '../components/admin-header';
import useRABC from '../hooks/useRABC';
import { useRouter } from 'next/router';
import { notify } from '../lib/notify';
import { useEffect } from 'react';
import AdminSideNav from '../components/AdminSideNav';

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { title: string; href: string }[];
};

function AdminLayout(props: AdminLayoutProps) {
  const rabc = useRABC();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

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
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <AdminSideNav collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Right column: header + scrollable content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <AdminHeader />
        <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
          <Box p="xl">{props.children}</Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
