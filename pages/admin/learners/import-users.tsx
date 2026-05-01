import { Stack, FileInput, Group, Button, Alert, Table, Text, Container } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useState, FormEventHandler } from 'react';
import AdminLayout from '../../../layouts/admin-layout';
import http from '../../../lib/http-client';
import { notify } from '../../../lib/notify';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';

function ImportUsersPage() {
  const [value, setValue] = useState<File | null>(null);
  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ['import-users'],
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('csv', value as File);
      const response = await http.post('/api/users/import', formData);
      return response.data;
    },
    onSuccess: () => {
      notify({
        type: 'success',
        message: 'Users imported successfully',
      });
      setValue(null);
      router.replace(router.asPath);
    },
    onError: () => {
      notify({
        type: 'error',
        message: 'Something went wrong',
      });
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <AdminLayout
      title="Import Users"
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Import Users', href: '/admin/learners/import-users' },
      ]}
    >
      <Container>
        <form onSubmit={handleSubmit}>
          <Stack>
            <FileInput
              label="CSV File"
              accept=".csv"
              placeholder="Select CSV file"
              withAsterisk
              value={value}
              onChange={setValue}
              description={
                <Text>
                  Template file can be downloaded from <a href="/api/users/import-template">here</a>
                  .
                </Text>
              }
            />
            <Group position="right">
              <Button type="submit" loading={mutation.isLoading}>
                {mutation.isLoading ? 'Uploading...' : 'Upload'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    await checkAuthorizationForPage(context, 'create:users');
    return { props: {} };
  },
});

export default ImportUsersPage;
