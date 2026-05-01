import { Button, FileInput, Group, Select, Stack, TextInput, Textarea } from '@mantine/core';
import AdminLayout from '../../../layouts/admin-layout';
import { courseDetailsSchema } from '../../../lib/schemas/zod-schemas';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useMutation, useQuery } from '@tanstack/react-query';
import http from '../../../lib/http-client';
import logger from '../../../lib/logger';
import { useRouter } from 'next/router';
import { notify } from '../../../lib/notify';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import content from '../../../lib/data/content';
import { checkAuthorizationForPage } from '../../../lib/auth-utils';

const courseSchemaWithPictureFile = courseDetailsSchema.extend({
  picture: z.any().refine((file) => file instanceof File, {
    message: 'Picture is required',
  }),
});

type FormInputData = z.infer<typeof courseSchemaWithPictureFile>;

function NewCoursePage() {
  const { register, handleSubmit, control, reset, formState, watch } = useForm<FormInputData>({
    resolver: zodResolver(courseSchemaWithPictureFile),
  });

  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ['courses', 'create'],
    mutationFn: async (data: FormInputData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.liveLink) {
        formData.append('liveLink', data.liveLink);
      }

      if (data.contentLink) {
        formData.append('contentLink', data.contentLink);
      }

      formData.append('picture', data.picture);

      logger.info('formData', formData);
      const response = await http.post('/api/courses', formData);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/admin/courses/${data.id}`);
      notify({
        title: 'Course created',
        message: 'Course created successfully',
        type: 'success',
      });
    },
  });

  const pictureFile = watch('picture');
  logger.error(formState.errors);

  const onSubmit = (data: FormInputData) => {
    mutation.mutate(data);
  };

  return (
    <AdminLayout
      title={'New Course'}
      breadcrumbs={[
        { title: 'Admin', href: '/admin' },
        { title: 'Courses', href: '/admin/courses' },
        {
          title: 'New Course',
          href: `/admin/courses/new`,
        },
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="Title"
            {...register('title')}
            error={formState.errors.title?.message}
            description="Course title"
          />
          <Textarea
            label="Description"
            placeholder="Description"
            {...register('description')}
            error={formState.errors.description?.message}
            description="Course description"
          />

          <Controller
            name="contentLink"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                data={content}
                label="Content"
                error={fieldState.error?.message}
                value={field.value}
                clearable
                onChange={(value) => field.onChange(value || undefined)}
              />
            )}
          />

          <Controller
            name="picture"
            control={control}
            render={({ field, fieldState }) => (
              <FileInput
                {...field}
                accept="image/*"
                label="Picture"
                error={fieldState.error?.message}
                description="Course picture"
              />
            )}
          />
          {pictureFile ? (
            <Image
              alt="Picture"
              src={URL.createObjectURL(pictureFile)}
              width={200}
              height={200}
              onLoad={() => URL.revokeObjectURL(pictureFile)}
            />
          ) : null}
          <TextInput
            label="Live class link"
            placeholder="Live class link"
            {...register('liveLink')}
            error={formState.errors.liveLink?.message}
            description="Link to the live class"
          />
          <Group position="right">
            <Button type="submit" disabled={formState.isSubmitting} loading={mutation.isLoading}>
              {mutation.isLoading ? 'Creating...' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={formState.isSubmitting}
            >
              Reset
            </Button>
          </Group>
        </Stack>
      </form>
    </AdminLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async (context) => {
    await checkAuthorizationForPage(context, 'create:courses');
    return {
      props: {},
    };
  },
});

export default NewCoursePage;
