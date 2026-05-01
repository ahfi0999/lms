import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulbFilled,
  IconX,
  IconSearch,
  IconSend,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import http from '../lib/http-client';
import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Code,
  Container,
  Loader,
  Paper,
  Skeleton,
  Stack,
  TextInput,
  Textarea,
  TypographyStylesProvider,
  useMantineTheme,
} from '@mantine/core';
import { APIError } from '../types/common';
import { isAxiosError } from 'axios';

function AskAI() {
  const [question, setQuestion] = useState('');
  const [enableQuery, setEnableQuery] = useState(false);
  const query = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['ask_ai'],
    queryFn: async () => {
      const res = await http.post<{ answer: string }>('/api/utils/kona-ai', {
        question,
      });
      return res.data;
    },
    onError: (error: APIError) => {
      notifications.show({
        title: 'Error',
        message: isAxiosError(error) ? error.response?.data.message : error.message,
        color: 'red',
        icon: <IconX />,
      });
    },
    refetchOnMount: false,
    cacheTime: Infinity,
    enabled: enableQuery,
  });
  const theme = useMantineTheme();

  const getAnswer = () => {
    if (!question) {
      notifications.show({
        title: 'Empty question',
        message: 'Please enter a question',
        color: 'blue',
        icon: <IconX />,
      });
      return;
    }
    setEnableQuery(true);
    query.refetch();
  };

  return (
    <Container fluid>
      <Stack>
        <Textarea
          size="md"
          w="100%"
          placeholder="Ask me anything"
          value={question}
          withAsterisk
          minRows={5}
          onChange={(e) => setQuestion(e.currentTarget.value)}
          rightSection={
            <ActionIcon
              mt="auto"
              mb="md"
              mr="md"
              size={32}
              radius="xl"
              loading={enableQuery && (query.isLoading || query.isRefetching)}
              disabled={!question}
              color={theme.primaryColor}
              variant="filled"
              onClick={getAnswer}
            >
              <IconSend size="1.1rem" stroke={1.5} />
            </ActionIcon>
          }
        />
        <Paper withBorder py="xl" bg="gray.1">
          {enableQuery ? (
            <Container>
              <Paper bg="white" p="xl">
                <TypographyStylesProvider>
                  {enableQuery && (query.isLoading || query.isRefetching) ? (
                    // <Center h={400}>
                    <Box>
                      <Skeleton height={14} radius="xl" />
                      {new Array(5).fill(0).map((_, index) => (
                        <Skeleton height={14} mt={6} radius="xl" key={index} />
                      ))}
                      <Skeleton height={14} mt={6} width="70%" radius="xl" />
                    </Box>
                  ) : (
                    //   <Loader variant="dots" />
                    // </Center>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: query.data ? query.data.answer : '<p>Something went wrong</p>',
                      }}
                    />
                  )}
                </TypographyStylesProvider>
              </Paper>
            </Container>
          ) : (
            <Alert icon={<IconBulbFilled />}>
              Power of AI at your fingertips. Ask me anything.
            </Alert>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

export default AskAI;
