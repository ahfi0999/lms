import { ContextModalProps } from '@mantine/modals';
import { z } from 'zod';
import { attachmentSchema } from '../lib/schemas/zod-schemas';
import {
  Input,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
  useMantineTheme,
  rem,
  Button,
  FileInput,
} from '@mantine/core';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import { useRouter } from 'next/router';

type UploadAttachmentModalProps = {
  attachmentType: z.infer<typeof attachmentSchema>['type'];
  courseId?: number;
  topicId?: number; // Exist if attachment is for a topic (type: topicFile)
};

const formDataSchema = attachmentSchema
  .pick({
    title: true,
    description: true,
  })
  .required()
  .extend({
    attachment: z.any(),
  });

type FormDataType = z.infer<typeof formDataSchema>;

const UploadAttachmentModal = ({
  context,
  id,
  innerProps,
}: ContextModalProps<UploadAttachmentModalProps>) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormDataType>();

  const closeModal = () => {
    context.closeModal(id);
  };
  const router = useRouter();
  const mutation = useMutation({
    mutationKey: ['attachments', 'create'],
    mutationFn: async (data: FormDataType) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('attachment', data.attachment);
      formData.append('type', innerProps.attachmentType);
      if (innerProps.courseId) {
        formData.append('courseId', innerProps.courseId.toString());
      }

      if (innerProps.topicId) {
        formData.append('topicId', innerProps.topicId.toString());
      }

      const response = await http.post('/api/attachments', formData);
      return response.data;
    },
    onSuccess: () => {
      notify({
        type: 'success',
        message: 'Attachment created successfully',
      });
      router.replace(router.asPath);
      closeModal();
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        <TextInput
          label="Name"
          description="Name of the attachment"
          {...register('title')}
          error={errors.title?.message}
          withAsterisk
        />

        <TextInput
          label="Description"
          description="Description of the attachment (optional)"
          {...register('description')}
        />
        <Controller
          name="attachment"
          control={control}
          render={({ field }) => (
            <FileInput
              withAsterisk
              // value={field.value}
              // onChange={(value) => field.onChange(value)}
              label="Attachment File"
              {...field}
              error={
                typeof errors.attachment?.message === 'string'
                  ? errors.attachment?.message
                  : undefined
              }
            />
          )}
        />
        <Group position="right">
          <Button type="submit" loading={mutation.isLoading}>
            {mutation.isLoading ? 'Uploading...' : 'Upload'}
          </Button>
          <Button variant="light" onClick={closeModal}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default UploadAttachmentModal;
