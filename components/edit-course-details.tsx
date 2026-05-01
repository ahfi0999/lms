import { logger } from '@azure/storage-blob';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, TextInput, Textarea, FileInput, Group, Button, Select } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import Image from 'next/image';
import { courseDetailsSchema } from '../lib/schemas/zod-schemas';
import { getCourseDataForAdminPage } from '../lib/data/courses';
import content from '../lib/data/content';

const courseSchemaWithPictureFile = courseDetailsSchema.extend({
  picture: z.any().optional(),
});

type FormInputData = z.infer<typeof courseSchemaWithPictureFile>;

type EditCourseDetailsProps = {
  course: Awaited<ReturnType<typeof getCourseDataForAdminPage>>;
};

function EditCourseDetails(props: EditCourseDetailsProps) {
  const router = useRouter();
  const refreshData = () => {
    router.replace(router.asPath);
  };
  const { register, handleSubmit, control, reset, formState, watch } = useForm<FormInputData>({
    resolver: zodResolver(courseSchemaWithPictureFile),
    defaultValues: {
      title: props.course.title,
      description: props.course.description,
      liveLink: props.course.liveLink,
      picture: props.course.picture,
      contentLink: props.course.contentLink || undefined,
    },
  });

  const updateCourseMutation = useMutation({
    mutationKey: ['courses', 'edit', props.course.id.toString()],
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
      const response = await http.put(`/api/courses/${props.course.id}`, formData);
      return response.data;
    },
    onSuccess: () => {
      refreshData();
      notify({
        title: 'Course updated',
        message: 'Course updated successfully',
        type: 'success',
      });
    },
  });

  const pictureFile: any = watch('picture');
  logger.error(formState.errors);

  const onSubmit = (data: FormInputData) => {
    console.log(data, 'submit');
    updateCourseMutation.mutate(data);
  };
  return (
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
              label="Content link"
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
        {pictureFile || props.course?.picture ? (
          <Image
            alt="Picture"
            src={
              Blob.prototype.isPrototypeOf(pictureFile)
                ? URL.createObjectURL(pictureFile)
                : z.string().parse(props.course?.picture)
            }
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
          <Button
            type="submit"
            disabled={formState.isSubmitting}
            loading={updateCourseMutation.isLoading}
          >
            {updateCourseMutation.isLoading ? 'Loading...' : 'Update'}
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
  );
}

export default EditCourseDetails;
