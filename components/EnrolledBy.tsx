import { Alert, Button, Container, Group, Loader, Pagination, Stack, Table } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import http from '../lib/http-client';
import { UserInfo } from '../types/auth0';
import { useState } from 'react';
import UnenrollButton from './UnenrollButton';
import { IconFileExport, IconHistory, IconMoodEmpty } from '@tabler/icons-react';
import useDownloadFile from '../hooks/useDownloadFile';
import Link from 'next/link';

type EnrolledByProps = {
  courseId: number;
  openAccessActivityHistory: () => void;
};

function EnrolledBy(props: EnrolledByProps) {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['enrolled-by', props.courseId, page],
    queryFn: async () => {
      const response = await http.get<{
        users: UserInfo[];
        total: number;
        page: number;
      }>(`/api/courses/${props.courseId}/enrolled-by`, {
        params: {
          page,
        },
      });
      return response.data;
    },
  });

  const exportQuery = useDownloadFile(`/api/courses/${props.courseId}/export-enrolled-users.ts`);

  const totalPages = Math.ceil((query?.data?.total || 0) / 10);

  const handleUnenroll = () => {
    query.refetch();
  };

  return (
    <Container>
      <Stack spacing="md">
        <Group position="right">
          <Button
            leftIcon={<IconFileExport size="1.2rem" />}
            target="_blank"
            component={Link}
            href={`/api/courses/${props.courseId}/export-enrolled-users`}
            disabled={query.data?.total === 0}
          >
            Export
          </Button>
          <Button
            variant="outline"
            leftIcon={<IconHistory size="1.2rem" />}
            onClick={props.openAccessActivityHistory}
          >
            Access Activity History
          </Button>
        </Group>
        {query.status === 'success' && query.data.total === 0 ? (
          <Alert icon={<IconMoodEmpty />} color="blue">
            No users enrolled yet
          </Alert>
        ) : null}

        {query.status === 'success' && query.data.total > 0 ? (
          <Stack>
            <Table withBorder withColumnBorders striped>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Unenroll</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <UnenrollButton
                        courseId={props.courseId}
                        userId={user.id}
                        onUnenroll={handleUnenroll}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Stack>
        ) : null}

        {query.status === 'loading' ? <Loader /> : null}

        <Pagination value={page} onChange={setPage} total={totalPages} />
      </Stack>
    </Container>
  );
}

export default EnrolledBy;
