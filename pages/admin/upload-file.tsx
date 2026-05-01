import AdminLayout from '../../layouts/admin-layout';
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Container,
  CopyButton,
  FileInput,
  Group,
  Progress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCopy, IconInfoCircle, IconLink } from '@tabler/icons-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import http from '../../lib/http-client';
import { notify } from '../../lib/notify';
import { PutBlobResult } from '@vercel/blob';
import { AxiosResponse } from 'axios';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { checkAuthorizationForPage } from '../../lib/auth-utils';

function UploadFile() {
  const [value, setValue] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationKey: ['upload-file'],
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('attachment', value as File);
      const res = await http.post<FormData, AxiosResponse<PutBlobResult>>(
        '/api/utils/upload-blob',
        formData,
        {
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress(Math.round((e.loaded * 100) / e.total));
            }
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setValue(null);
      setProgress(0);
      notify({ title: 'File uploaded', message: 'File uploaded successfully', type: 'success' });
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    mutation.mutate();
  };

  return (
    <AdminLayout title="File Upload" breadcrumbs={[]}>
      <Container>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Alert color="blue" icon={<IconInfoCircle />} title="Upload File">
              Upload a file to the blob storage
            </Alert>
            {progress > 0 && progress < 100 ? (
              <Group>
                <Progress striped animate value={progress} /> <Text>{progress}%</Text>
              </Group>
            ) : null}

            {mutation?.data?.url ? (
              <Alert color="green" icon={<IconLink />} title="Access Link">
                <Group>
                  <Anchor href={mutation.data.url} target="_blank" rel="noopener noreferrer">
                    {mutation.data.url}{' '}
                  </Anchor>
                  <CopyButton value={mutation.data.url}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                        <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                          {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Alert>
            ) : null}

            <FileInput
              label="Upload file"
              placeholder="Choose file"
              accept="image/*"
              required
              onChange={setValue}
              value={value}
            />
            <Stack>
              <Group>
                <Button disabled={!value} loading={mutation.isLoading} type="submit">
                  {mutation.isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </Group>
            </Stack>
          </Stack>
        </form>
      </Container>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    await checkAuthorizationForPage(context, 'utils:upload_files');
    return {
      props: {},
    };
  },
});

export default UploadFile;
