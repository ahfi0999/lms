import { Center, Tooltip, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import useUnenrollMutation from '../hooks/useUnenrollMutation';

type UnenrollButtonProps = {
  courseId: number;
  userId: string;
  onUnenroll?: () => void;
};

function UnenrollButton(props: UnenrollButtonProps) {
  const unenrollMutation = useUnenrollMutation(props.onUnenroll);

  return (
    <Center>
      <Tooltip label="Unenroll user from course">
        <ActionIcon
          color="red"
          loading={
            unenrollMutation.isLoading && unenrollMutation.variables?.courseId === props.courseId
          }
          disabled={
            unenrollMutation.isLoading && unenrollMutation.variables?.courseId === props.courseId
          }
          onClick={() =>
            unenrollMutation.mutate({
              userId: props.userId,
              courseId: props.courseId,
            })
          }
        >
          <IconX size="1.2rem" />
        </ActionIcon>
      </Tooltip>
    </Center>
  );
}

export default UnenrollButton;
