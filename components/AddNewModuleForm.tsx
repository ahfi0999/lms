import { Button, Flex, Group, Paper, Stack, TextInput } from '@mantine/core';
import { useFocusTrap } from '@mantine/hooks';
import { useMutation } from '@tanstack/react-query';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addModuleSchema } from '../lib/schemas/zod-schemas';
import { z } from 'zod';
import { useRouter } from 'next/router';

type AddNewModuleFormProps = {
  courseId: number;
  cancel: () => void;
};

type FormInputData = z.infer<typeof addModuleSchema>;

function AddNewModuleForm(props: AddNewModuleFormProps) {
  // TODO: Fix focus issue
  // + breaks drag and drop
  //   const focusTrapRef = useFocusTrap(true);
  const { register, handleSubmit, formState } = useForm<FormInputData>({
    resolver: zodResolver(addModuleSchema),
  });
  const router = useRouter();

  const addModuleMutation = useMutation({
    mutationKey: ['courses', 'addModule', props.courseId.toString()],
    mutationFn: async (data: FormInputData) => {
      const response = await http.post(`/api/modules`, {
        ...data,
        courseId: props.courseId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      notify({
        title: 'Module added',
        message: 'Module added successfully',
        type: 'success',
      });
      router.replace(router.asPath);
      props.cancel();
    },
  });

  const onSubmit = (data: FormInputData) => {
    addModuleMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex gap="md" w="100%">
        <TextInput w="100%" placeholder="Module name" {...register('title')} />
        <Button
          type="submit"
          loading={addModuleMutation.isLoading}
          disabled={formState.isSubmitting}
        >
          {addModuleMutation.isLoading ? 'Submitting' : 'Submit'}
        </Button>
      </Flex>
    </form>
  );
}

export default AddNewModuleForm;
