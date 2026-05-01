import { Button, Group, Paper, Stack, TextInput } from '@mantine/core';
import { addTopicSchema } from '../lib/schemas/zod-schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { notify } from '../lib/notify';
import http from '../lib/http-client';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

type AddNewTopicFormProps = {
  cancel: () => void;
  courseId: number;
  moduleId: number;
};

type FormInputData = z.infer<typeof addTopicSchema>;

function AddNewTopicForm(props: AddNewTopicFormProps) {
  const { register, handleSubmit, formState, reset } = useForm<FormInputData>({
    resolver: zodResolver(addTopicSchema),
  });
  const router = useRouter();

  const addTopicMutation = useMutation({
    mutationKey: ['courses', 'addTopic', props.courseId.toString(), props.moduleId.toString()],
    mutationFn: async (data: FormInputData) => {
      const response = await http.post(`/api/topics`, {
        title: data.title,
        videoLink: data.videoLink,
        courseId: props.courseId,
        moduleId: props.moduleId,
      });
      return response.data;
    },
    onSuccess: () => {
      notify({
        title: 'Topic added',
        message: 'Topic added successfully',
        type: 'success',
      });
      router.replace(router.asPath);
      reset();
      props.cancel();
    },
  });

  const onSubmit = (data: FormInputData) => {
    addTopicMutation.mutate(data);
  };

  return (
    <Paper p="md" withBorder bg="gray.1">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput label="Topic Name" {...register('title')} />
          <TextInput label="Video URL" {...register('videoLink')} />
          <Group position="right">
            <Button
              type="submit"
              loading={addTopicMutation.isLoading}
              disabled={formState.isSubmitting}
            >
              {addTopicMutation.isLoading ? 'Submitting' : 'Submit'}
            </Button>
            <Button type="button" variant="outline" onClick={props.cancel}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

export default AddNewTopicForm;
