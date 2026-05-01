import { UnstyledButton, Group, Paper, Text } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import account from '../lib/data/account';

type LogoProps = {
  width?: number;
  height?: number;
};

function Logo(props: LogoProps) {
  return (
    <>
      <UnstyledButton component={Link} href="/dashboard">
        <Group spacing="xs">
          <Image
            height={props.height || account.logoDimensions.height}
            width={props.width || account.logoDimensions.width}
            src={account.logo}
            alt={account.name}
          />
        </Group>
      </UnstyledButton>
    </>
  );
}

export default Logo;
