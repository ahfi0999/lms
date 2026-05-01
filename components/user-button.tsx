import { forwardRef } from 'react';
import { Group, Avatar, Text, UnstyledButton, createStyles } from '@mantine/core';
import { Nullable } from '../types/utils';

interface UserButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  avatar: Nullable<string>;
  name: string;
  email: string;
}

const useStyles = createStyles((theme) => ({
  wrapper: {
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
      borderRadius: theme.radius.sm,
    },
  },
}));

// eslint-disable-next-line react/display-name
const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ avatar, name, email, color, ...others }: UserButtonProps, ref) => {
    const styles = useStyles();
    return (
      <UnstyledButton
        ref={ref}
        p="sm"
        sx={(theme) => ({
          display: 'block',
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        })}
        {...others}
        className={styles.classes.wrapper}
      >
        <Group>
          <Avatar variant="outline" src={avatar} radius="xl" />

          <div style={{ flex: 1 }}>
            <Text size="sm" weight={500}>
              {name}
            </Text>

            <Text color="dimmed" size="xs">
              {email}
            </Text>
          </div>
        </Group>
      </UnstyledButton>
    );
  }
);

export default UserButton;
