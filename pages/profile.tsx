import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { GoVerified, GoUnverified } from 'react-icons/go';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Divider,
  FileInput,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  createStyles,
} from '@mantine/core';
import { IconCheck, IconLock, IconUpload, IconUserCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { InferGetServerSidePropsType } from 'next';
import { useEffect, useMemo } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import usePasswordResetMutation from '../hooks/usePasswordResetMutation';
import useSendEmailVerificationLink from '../hooks/useSendEmailVerificationLink';
import http from '../lib/http-client';
import { ProfileUpdateResponse } from '../types/common';
import RootLayout from '../layouts/root';
import useSilentAuth from '../hooks/useSilentAuth';

interface FormInputData {
  name: string;
  email: string;
  picture?: File;
}

const AVATAR_GRADIENTS = [
  { from: 'indigo', to: 'cyan' },
  { from: 'teal', to: 'lime' },
  { from: 'orange', to: 'red' },
  { from: 'grape', to: 'pink' },
  { from: 'blue', to: 'violet' },
] as const;

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string, email: string) {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const useStyles = createStyles((theme) => ({
  page: {
    background:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[8]
        : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
    minHeight: '100%',
    paddingBlock: theme.spacing.xl,
  },
  hero: {
    background:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[6]
        : 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
  },
  card: {
    borderRadius: theme.radius.lg,
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: theme.fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
  },
}));

function ProfilePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { classes } = useStyles();
  const silentAuth = useSilentAuth();
  const { register, handleSubmit, control, reset, watch, formState } = useForm<FormInputData>({
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

  const watchedPicture = watch('picture');
  const watchedName = watch('name');

  const previewUrl = useMemo(() => {
    if (watchedPicture instanceof File) return URL.createObjectURL(watchedPicture);
    return null;
  }, [watchedPicture]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = previewUrl || props.user?.picture || undefined;
  const initials = getInitials(watchedName || props.user?.name || '', props.user?.email || '');
  const gradient = pickGradient(props.user?.email || '');

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
      <Box className={classes.page}>
        <Container size="sm">
          <Paper className={classes.hero} mb="xl" shadow="xs">
            <Group spacing="lg" noWrap>
              <Avatar
                src={avatarSrc}
                size={96}
                radius={96}
                variant="gradient"
                gradient={gradient}
                styles={{ placeholder: { fontSize: 28, fontWeight: 700 } }}
              >
                {initials}
              </Avatar>
              <Stack spacing={4} sx={{ flex: 1, minWidth: 0 }}>
                <Title order={2} sx={{ lineHeight: 1.2 }}>
                  {props.user?.name || 'Your Profile'}
                </Title>
                <Group spacing="xs">
                  <Text color="dimmed" truncate>
                    {props.user?.email}
                  </Text>
                  {props.user?.email_verified ? (
                    <Badge
                      color="teal"
                      variant="light"
                      size="sm"
                      leftSection={<IconCheck size={10} />}
                    >
                      Verified
                    </Badge>
                  ) : (
                    <Badge color="red" variant="light" size="sm">
                      Unverified
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>
          </Paper>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Paper className={classes.card} shadow="xs" p="xl" mb="lg" withBorder>
              <Group spacing="xs" mb="md">
                <IconUserCircle size={18} />
                <Text className={classes.sectionTitle}>Account details</Text>
              </Group>

              <Stack spacing="md">
                <TextInput
                  label="Name"
                  placeholder="John Doe"
                  size="md"
                  {...register('name', { required: true })}
                />
                <TextInput
                  label="Email"
                  placeholder="john@example.com"
                  size="md"
                  inputWrapperOrder={['label', 'input', 'description']}
                  {...register('email', { required: true })}
                  description={
                    props.user?.email_verified ? (
                      <Group spacing={4}>
                        <GoVerified color="green" />
                        <Text component="span" size="xs">
                          Email Verified
                        </Text>
                      </Group>
                    ) : (
                      <Group spacing={4}>
                        <GoUnverified color="red" />
                        <Anchor
                          component={UnstyledButton<'button'>}
                          onClick={() => verifyEmailMutation.mutate()}
                          disabled={verifyEmailMutation.isLoading}
                          size="xs"
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
                      description="PNG or JPG, recommended 200×200 or larger"
                      placeholder="Click to upload"
                      icon={<IconUpload size={16} />}
                      size="md"
                    />
                  )}
                />
              </Stack>

              <Divider my="lg" />

              <Group position="right">
                <Button
                  type="submit"
                  size="md"
                  loading={mutation.isLoading}
                  disabled={!formState.isDirty}
                  leftIcon={<IconCheck size={16} />}
                >
                  Save changes
                </Button>
              </Group>
            </Paper>

            <Paper className={classes.card} shadow="xs" p="xl" withBorder>
              <Group spacing="xs" mb="md">
                <IconLock size={18} />
                <Text className={classes.sectionTitle}>Security</Text>
              </Group>

              <Group position="apart" align="center" noWrap>
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Text weight={500}>Reset password</Text>
                  <Text color="dimmed" size="sm">
                    We'll email you a secure link to choose a new password.
                  </Text>
                </Stack>
                <Button
                  variant="outline"
                  onClick={handlePasswordReset}
                  loading={passwordResetMutation.isLoading}
                  type="button"
                >
                  Reset password
                </Button>
              </Group>
            </Paper>
          </form>
        </Container>
      </Box>
    </RootLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();

export default ProfilePage;
