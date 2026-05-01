import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Center,
  Chip,
  Flex,
  Group,
  List,
  Mark,
  Space,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { Module, Topic } from '../types/courses';
import { IconExternalLink, IconPaperclip, IconPlus, IconTrash } from '@tabler/icons-react';
import { modals, openContextModal } from '@mantine/modals';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { attachmentSchema, idSchema, updateModuleSchema } from '../lib/schemas/zod-schemas';
import DownloadFile from './DownloadFile';
import DownloadAzureFile from './DownloadAzureFile';
import { useEffect } from 'react';

const formInputSchema = updateModuleSchema.pick({
  title: true,
  topics: true,
});

type EditTopicsProps = {
  courseId: number;
  moduleId: number;
  module: Module;
};

type FormInputData = z.infer<typeof formInputSchema>;

function EditModule(props: EditTopicsProps) {
  const { register, handleSubmit, control, reset, formState, watch } = useForm<FormInputData>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      ...props.module,
      topics: [...props.module.topics.sort((a, b) => a.id - b.id)],
    },
  });

  const deleteModuleMutation = useMutation({
    mutationKey: ['courses', 'deleteModule'],
    mutationFn: async (moduleId: number) => {
      const response = await http.delete(`/api/modules/${moduleId}`);
      return response.data;
    },
    onSuccess: () => {
      refreshData();
      notify({
        title: 'Module deleted',
        message: 'Module deleted successfully',
        type: 'success',
      });
    },
  });

  const handleDeleteModule = (module: Pick<Module, 'id' | 'title'>) => {
    modals.openConfirmModal({
      title: 'Please confirm',
      children: (
        <Text size="sm">
          Are you sure you want to delete the module <Mark>{module.title}</Mark>? All topics will be
          deleted as well.
        </Text>
      ),
      labels: { confirm: 'Confirm', cancel: 'Cancel' },
      onConfirm: () => {
        deleteModuleMutation.mutate(module.id);
      },
      onCancel: () => {
        modals.closeAll();
      },
    });
  };

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'topics', // unique name for your Field Array
    keyName: 'key',
  });

  const router = useRouter();
  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handleAttachmentUpload = (topicId: number) => {
    openContextModal({
      modal: 'uploadAttachment',
      title: 'Upload Attachment',
      innerProps: {
        attachmentType: 'topicFile',
        topicId,
      },
    });
  };

  const mutation = useMutation({
    mutationKey: ['update-module', props.moduleId],
    mutationFn: async (data: FormInputData) => {
      const response = await http.put(`/api/modules/${props.moduleId}`, {
        ...data,
        courseId: props.courseId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      notify({
        message: 'Modules updated successfully',
        type: 'success',
        id: 'module-update-success',
      });
    },
    onSettled: () => {
      refreshData();
    },
  });

  useEffect(() => {
    reset({ ...props.module, topics: [...props.module.topics.sort((a, b) => a.id - b.id)] });
  }, [props.module]);

  const onSubmit = async (data: FormInputData) => {
    mutation.mutate(data);
  };

  return (
    <Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Flex align="flex-end" gap="xl" mb="md">
            <TextInput
              w="100%"
              label="Module Title"
              {...register('title')}
              error={formState.errors?.title?.message}
            />
            <Tooltip label="Delete module">
              <ActionIcon pb="xs" onClick={() => handleDeleteModule(props.module)}>
                <IconTrash color="red" />
              </ActionIcon>
            </Tooltip>
          </Flex>
          <Flex mb="lg" justify="space-between" align="center" gap="xl">
            <Box w="10px" fw="bold">
              #
            </Box>
            <Box w="40%" fw="bold">
              Topic
            </Box>
            <Box w="40%" fw="bold">
              Link
            </Box>
            <Box w="10%" fw="bold">
              Delete
            </Box>
          </Flex>
          {fields.map((topic, index) => {
            const attachments =
              props.module.topics.find((t) => t.id === topic.id)?.attachments ?? [];

            return (
              <>
                <Flex justify="space-between" align="center" key={topic.key} gap="xl">
                  <Box w="10px">
                    <Text fw="bold">{index + 1}</Text>
                  </Box>
                  <Box w="40%">
                    <TextInput
                      {...register(`topics.${index}.title`)}
                      error={formState.errors?.topics?.[index]?.title?.message}
                    />
                  </Box>
                  <Box w="40%">
                    <TextInput
                      {...register(`topics.${index}.videoLink`)}
                      error={formState.errors?.topics?.[index]?.videoLink?.message}
                    />
                  </Box>
                  <Box w="10%">
                    <Tooltip label={`Delete topic "${topic.title}"`}>
                      <ActionIcon
                        onClick={() => {
                          remove(index);
                        }}
                        ta="center"
                        color="orange"
                        size="sm"
                      >
                        <IconTrash />
                      </ActionIcon>
                    </Tooltip>
                  </Box>
                </Flex>
                <Box ml="10px" sx={{ borderBottom: 1 }} mb="md">
                  {topic.id ? (
                    <Text fw="semibold" color="gray">
                      Attachments:
                    </Text>
                  ) : null}
                  {attachments.map((attachment) => (
                    <>
                      <List withPadding icon={<IconPaperclip size="0.7rem" />}>
                        <List.Item>
                          <DownloadAzureFile link={attachment.file} title={attachment.title} />
                        </List.Item>
                      </List>
                    </>
                  ))}
                  {
                    // Show this only if topic is already created
                    topic.id ? (
                      <Group>
                        <Anchor<'button'>
                          type="button"
                          onClick={
                            topic.id
                              ? () => handleAttachmentUpload(idSchema.parse(topic.id))
                              : () => {}
                          }
                        >
                          <Flex align="center" my="xs">
                            <IconPlus size="1rem" />
                            <Text size="sm" fw="bold" pl="xs">
                              Add Attachment
                            </Text>
                          </Flex>
                        </Anchor>
                      </Group>
                    ) : null
                  }
                </Box>
              </>
            );
          })}
        </Stack>
        <Group>
          <Anchor<'button'>
            onClick={() => {
              append({
                title: '',
                videoLink: null,
              });
            }}
          >
            <Center>
              <Flex justify="center" pt="sm" align="center">
                <IconPlus size="1rem" />
                <Text size="sm" fw={600} truncate pl="xs">
                  Add Topic
                </Text>
              </Flex>
            </Center>
          </Anchor>
        </Group>
        {formState.errors.topics && (
          <Box>
            <Text color="red" size="sm">
              {formState.errors.topics.message}
            </Text>
          </Box>
        )}
        <Group position="right">
          <Button
            variant="light"
            disabled={!formState.isDirty}
            onClick={() => {
              reset(props.module);
            }}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!formState.isDirty} loading={mutation.isLoading}>
            Save
          </Button>
        </Group>
      </form>
    </Stack>
  );
}

export default EditModule;
