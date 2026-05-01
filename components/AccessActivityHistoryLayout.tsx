import { Button, Container, Divider, Group, Stack, Title } from '@mantine/core';

type AccessActivityHistoryLayoutProps = {
  close: () => void;
  children: React.ReactNode;
};

function AccessActivityHistoryLayout(props: AccessActivityHistoryLayoutProps) {
  return (
    <Container mx="auto" mt={40}>
      <Stack>
        <Title order={4} align="center">
          Access Activity History
        </Title>
        <Group position="right">
          <Button onClick={props.close}>Close</Button>
        </Group>
        {props.children}
        <Divider />
      </Stack>
    </Container>
  );
}

export default AccessActivityHistoryLayout;
