import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import { bulkEnrollSchema } from '../lib/schemas/zod-schemas';
import { useState } from 'react';
import { BulkEnrollResult } from '../types/courses';
import { IconMoodHappyFilled } from '@tabler/icons-react';

type BulkEnrollmentProps = {
  courseId: number;
};

function BulkEnrollment(props: BulkEnrollmentProps) {
  const queryClient = useQueryClient();
  const [emails, setEmails] = useState('');
  const mutation = useMutation({
    mutationKey: ['courses', 'bulk-enroll', props.courseId],
    mutationFn: async (data: string[]) => {
      const response = await http.post<BulkEnrollResult[]>(
        `/api/courses/${props.courseId}/bulk-enroll`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setEmails('');
      queryClient.invalidateQueries(['enrolled-by', props.courseId]);
      notify({
        message: 'Data processed successfully',
        type: 'success',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredEmails = emails
      .toString()
      .split(',')
      .map((email) => email.trim());

    const parsedData = bulkEnrollSchema.safeParse(enteredEmails);

    if (!parsedData.success) {
      notify({
        title: 'Invalid emails',
        message: 'Please enter valid emails',
        type: 'error',
      });

      return;
    }

    mutation.mutate(parsedData.data);
  };

  const handleReset = () => {
    setEmails('');
    mutation.reset();
  };

  return (
    <Container>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Textarea
            placeholder="learner1@example.com, learner2@example.com"
            label="Emails"
            withAsterisk
            required
            name="emails"
            value={emails}
            onChange={(event) => setEmails(event.currentTarget.value)}
            id="emails"
            autosize
            styles={{
              input: { fontFamily: 'monospace' },
            }}
            minRows={10}
            description="Enter emails of learners to enroll in this course (comma separated)"
          />
          <Group>
            <Button type="submit" loading={mutation.isLoading} disabled={mutation.isLoading}>
              Enroll
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </Group>
          {mutation.status === 'success' && mutation.data.length > 0 ? (
            <Stack mt="xl">
              <Title order={5}>Last enrollment results</Title>
              <Table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {mutation.data.map((result) => (
                    <tr key={result.email}>
                      <td>{result.email}</td>
                      <Text component="td">
                        {result.result === 'success' ? (
                          <Badge color="green">Success</Badge>
                        ) : (
                          <Badge color="red">Failed</Badge>
                        )}
                      </Text>
                      <td>{result.result === 'error' ? result.message : null}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Stack>
          ) : null}

          {mutation.status === 'success' && mutation.data.length === 0 ? (
            <Alert icon={<IconMoodHappyFilled />} color="green" variant="filled">
              All learners enrolled successfully
            </Alert>
          ) : null}
        </Stack>
      </form>
    </Container>
  );
}

export default BulkEnrollment;
