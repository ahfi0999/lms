import { Button, ButtonProps } from '@mantine/core';
import { GoogleIcon } from './GoogleIcon';
import { ComponentPropsWithRef } from 'react';

function GoogleButton(props: ButtonProps & ComponentPropsWithRef<'button'>) {
  return <Button leftIcon={<GoogleIcon />} variant="default" color="gray" {...props} />;
}

export default GoogleButton;
