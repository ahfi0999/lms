import { UnstyledButton, Group, Center, rem, createStyles, Text } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

type TableHeaderCellProps = {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort: () => void;
  disabled?: boolean;
};

const useStyles = createStyles((theme) => ({
  th: {
    padding: '0 !important',
    fontWeight: 600,
  },

  control: {
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

  icon: {
    width: rem(21),
    height: rem(21),
    borderRadius: rem(21),
  },
}));

function TableHeaderCell(props: TableHeaderCellProps) {
  const { classes } = useStyles();
  const Icon = props.sorted ? (props.reversed ? IconChevronUp : IconChevronDown) : IconSelector;

  return (
    <th className={classes.th}>
      <UnstyledButton disabled={props.disabled} onClick={props.onSort} className={classes.control}>
        <Group position="apart">
          <Text fw={500} fz="sm">
            {props.children}
          </Text>
          {props.disabled ? null : (
            <Center className={classes.icon}>
              <Icon size="0.9rem" stroke={1.5} />
            </Center>
          )}
        </Group>
      </UnstyledButton>
    </th>
  );
}

export default TableHeaderCell;
