import { Stack, List, Alert, Group, Text, Button } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import DownloadAzureFile from './DownloadAzureFile';
import { Attachment } from '../types/utils';
import useDeleteAttachment from '../hooks/useDeleteAttachment';
import { Permission } from '../types/auth0';

type ResourcesProps = {
  resourceFiles: Attachment[];
  emptyMessage?: string;
  permissions: Permission[];
};

function Resources(props: ResourcesProps) {
  const deleteMutation = useDeleteAttachment();

  if (props.resourceFiles.length === 0) {
    return (
      <Alert icon={<IconMoodEmpty />}>
        <Text>{props.emptyMessage || 'No resources available'}</Text>
      </Alert>
    );
  }

  return (
    <List withPadding spacing="md">
      {props.resourceFiles.map((resource) => (
        <List.Item key={resource.id}>
          <Stack spacing={2}>
            <DownloadAzureFile title={resource.title} link={resource.file} />
            <Text color="gray">{resource.description || 'No description'}</Text>
            {props.permissions.includes('write:resources') ? (
              <Group>
                <Button
                  onClick={() => deleteMutation.mutate(resource.id)}
                  loading={deleteMutation.isLoading}
                  variant="light"
                  size="xs"
                  color="red"
                  mt="sm"
                >
                  Delete
                </Button>
              </Group>
            ) : null}
          </Stack>
        </List.Item>
      ))}
    </List>
  );
}
export default Resources;
