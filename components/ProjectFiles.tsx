import { Stack, Title, List, Alert, Group, Anchor, Text, Button } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import DownloadAzureFile from './DownloadAzureFile';
import { Attachment } from '../types/utils';
import useDeleteAttachment from '../hooks/useDeleteAttachment';
import { Permission } from '../types/auth0';

type ProjectFilesProps = {
  projectFiles: Attachment[];
  emptyMessage?: string;
  permissions: Permission[];
};

function ProjectFiles(props: ProjectFilesProps) {
  const deleteMutation = useDeleteAttachment();
  if (props.projectFiles.length === 0) {
    return (
      <Alert icon={<IconMoodEmpty />}>
        {props.emptyMessage || 'There are no project files for this course.'}
      </Alert>
    );
  }

  return (
    <List withPadding spacing="md">
      {props.projectFiles.map((project) => (
        <List.Item key={project.id}>
          <Stack spacing={2}>
            <DownloadAzureFile title={project.title} link={project.file} />
            <Text color="gray">{project.description || 'No description'}</Text>
            {props.permissions.includes('write:project_files') ? (
              <Group>
                <Button
                  onClick={() => deleteMutation.mutate(project.id)}
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
export default ProjectFiles;
