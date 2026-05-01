import { AppShell, Box } from '@mantine/core';
import RootHeader from '../components/root-header';

type RootLayoutProps = {
  children: React.ReactNode;
};

function RootLayout(props: RootLayoutProps) {
  // const { user, error, isLoading } = useUser();

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>{error.message}</div>;

  // if (!user) {
  //   return <LoginPage />;
  // }

  return (
    <AppShell header={<RootHeader />} pb="xl">
      <Box>{props.children}</Box>
    </AppShell>
  );
}

export default RootLayout;
