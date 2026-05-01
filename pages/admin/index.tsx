import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import AdminLayout from '../../layouts/admin-layout';
import { GetServerSidePropsContext } from 'next';
import { checkAuthorizationForPage } from '../../lib/auth-utils';

type AdminPageProps = {};

function AdminPage(props: AdminPageProps) {
  return (
    <AdminLayout title="Admin" breadcrumbs={[{ title: 'Admin', href: '/admin' }]}>
      test
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context: GetServerSidePropsContext) => {
    // Redirect to /admin/courses for now until we have a dashboard
    await checkAuthorizationForPage(context, 'admin:dashboards');
    return {
      redirect: {
        permanent: false,
        destination: '/admin/courses',
      },
    };
  },
});

export default AdminPage;
