import {
  createStyles,
  Title,
  Text,
  Button,
  Container,
  Group,
  rem,
  Anchor,
  Stack,
} from '@mantine/core';
import { useRouter } from 'next/router';
import account from '../lib/data/account';

const useStyles = createStyles((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function ServerError() {
  const router = useRouter();
  const { classes } = useStyles();

  return (
    <div className={classes.root}>
      <Container>
        <Stack>
          <Title mb={rem(20)} order={1} align="center">
            Sorry, something went wrong. Please try again later.
          </Title>
          <Text size="lg" align="center">
            Please contact support at{' '}
            <Anchor href={`mailto:${account.supportEmail}`}>{account.supportEmail}</Anchor> for any
            questions. We are sorry for the inconvenience. You can also try to refresh the page by
            clicking the button below.
          </Text>
          <Group position="center">
            <Button variant="white" size="md" onClick={() => router.reload()}>
              Refresh the page
            </Button>
          </Group>
        </Stack>
      </Container>
    </div>
  );
}

export default ServerError;
