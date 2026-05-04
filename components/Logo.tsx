import { UnstyledButton, Group, Box } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import account from '../lib/data/account';

type LogoProps = {
  width?: number;
  height?: number;
};

function Logo(props: LogoProps) {
  return (
    <UnstyledButton component={Link} href="/dashboard">
      <Group spacing="xs">
        <Box
          sx={(theme) => ({
            display: 'inline-flex',
            padding: theme.colorScheme === 'dark' ? `4px 10px` : 0,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colorScheme === 'dark' ? theme.white : 'transparent',
          })}
        >
          <Image
            height={props.height || account.logoDimensions.height}
            width={props.width || account.logoDimensions.width}
            src={account.logo}
            alt={account.name}
          />
        </Box>
      </Group>
    </UnstyledButton>
  );
}

export default Logo;
