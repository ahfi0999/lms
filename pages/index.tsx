import { createStyles, Button, Title, Text, Anchor, Stack } from '@mantine/core';
import Balancer from 'react-wrap-balancer';
import PublicLayout from '../layouts/public-layout';
import { IconLogin } from '@tabler/icons-react';
import { GetServerSidePropsContext } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import account from '../lib/data/account';

const useStyles = createStyles((theme) => ({
  title: {
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
  },

  logo: {
    objectFit: 'scale-down',
    margin: '0 auto 25% auto',
  },
}));

function SigninPage() {
  const { classes } = useStyles();

  return (
    <PublicLayout>
      <Stack spacing="xl">
        <Title order={2} variant="gradient" className={classes.title} ta="center" mb="xl">
          <Balancer>Welcome back to {account.name}&apos;s Learning!</Balancer>
        </Title>
        <Button
          component="a"
          mt="md"
          rightIcon={<IconLogin size="1.2rem" />}
          href={`/api/auth/login?returnTo=/dashboard&audience=${encodeURIComponent(
            process.env.NEXT_PUBLIC_AUTH0_API_APP_IDENTIFIER
          )}`}
        >
          Sign In
        </Button>
        <Text ta="center" size="sm">
          Don&apos;t have an account?{' '}
          <Anchor<'a'> href={account.contactPage} target="_blank" weight={700}>
            Contact us.
          </Anchor>
        </Text>
      </Stack>
    </PublicLayout>
  );
}

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context.req, context.res);

  if (session?.user) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default SigninPage;
