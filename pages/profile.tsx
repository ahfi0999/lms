import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { GoVerified, GoUnverified } from 'react-icons/go';
import {
  Anchor,
  Button,
  Container,
  FileInput,
  Group,
  Stack,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { InferGetServerSidePropsType } from 'next';
import usePasswordResetMutation from '../hooks/usePasswordResetMutation';
import useSendEmailVerificationLink from '../hooks/useSendEmailVerificationLink';
import http from '../lib/http-client';
import { ProfileUpdateResponse } from '../types/common';
import RootLayout from '../layouts/root';
import { useEffect } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import useSilentAuth from '../hooks/useSilentAuth';
import { notify } from '../lib/notify';

interface FormInputData {
  name: string;
  email: string;
  picture?: File;
}

function ProfilePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const silentAuth = useSilentAuth();
  const { register, handleSubmit, control, reset, formState } = useForm<FormInputData>({
    defaultValues: {
      name: props.user?.name || '',
      email: props.user?.email || '',
    },
  });

  useEffect(() => {
    reset({
      name: props.user?.name || '',
      email: props.user?.email || '',
    });
  }, [props.user?.name, props.user?.email]);

  const verifyEmailMutation = useSendEmailVerificationLink();
  const passwordResetMutation = usePasswordResetMutation(props.user.email);
  const mutation = useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: async (data: FormData) => {
      try {
        const res = await http.put<ProfileUpdateResponse>('/api/update-profile', data);
        return res.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return Promise.reject(error.response?.data);
        }
        return Promise.reject(error);
      }
    },
    onSuccess: async (data) => {
      silentAuth();
      if (data) {
        notifications.show({
          title: 'Profile updated',
          message: 'Your profile has been updated successfully',
          color: 'teal',
          icon: <IconCheck />,
        });
      }
    },
  });

  const onSubmit = (data: FormInputData) => {
    const formData = new FormData();
    formData.set('name', data.name);
    formData.set('email', data.email);
    if (data.picture) {
      formData.set('picture', data.picture);
    }
    mutation.mutate(formData);
  };

  const handlePasswordReset = async () => {
    passwordResetMutation.mutate();
  };

  return (
    <RootLayout>
      <Container size="sm">
        <Title align="center" my={30}>
          Update Profile Information
        </Title>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing="xl">
            <TextInput
              label="Name"
              placeholder="John Doe"
              {...register('name', {
                required: true,
              })}
            />
            <TextInput
              label="Email"
              placeholder="john@example.com"
              inputWrapperOrder={['label', 'input', 'description']}
              {...register('email', {
                required: true,
              })}
              description={
                props.user?.email_verified ? (
                  <Group spacing={4}>
                    <GoVerified color="green" />
                    <>Email Verified</>
                  </Group>
                ) : (
                  <Group spacing={4}>
                    <GoUnverified color="red" />
                    <Anchor
                      component={UnstyledButton<'button'>}
                      onClick={() => verifyEmailMutation.mutate()}
                      disabled={verifyEmailMutation.isLoading}
                    >
                      Send verification email.
                    </Anchor>
                  </Group>
                )
              }
            />

            <Controller
              control={control}
              name="picture"
              render={({ field }) => (
                <FileInput
                  {...field}
                  accept="image/png, image/jpeg"
                  value={field.value}
                  onChange={(file) => field.onChange(file || undefined)}
                  label="Profile picture"
                  description="Upload your profile picture"
                />
              )}
            />
            <Button type="submit" loading={mutation.isLoading} disabled={!formState.isDirty}>
              Save
            </Button>
            <Button variant="outline" onClick={handlePasswordReset} type="button">
              Reset password
            </Button>
          </Stack>
        </form>
      </Container>
    </RootLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();

export default ProfilePage;
