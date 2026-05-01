import { Head } from '@react-email/head';
import { Button } from '@react-email/button';
import { Container } from '@react-email/container';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Text } from '@react-email/text';
import account from '../lib/data/account';
import EmailLayout from './email-layout';

type ResetPasswordEmailProps = {
  passwordResetUrl: string;
  name: string;
};

function ResetPasswordEmail(props: ResetPasswordEmailProps) {
  return (
    <EmailLayout>
      <Head>
        <title>Reset your password</title>
      </Head>
      <Container>
        <Heading>Reset your password</Heading>
        <Text>Hello {props.name},</Text>
        <Text>
          You recently requested to reset your password for your account. Click the button below to
          reset it.
        </Text>
        <Button pX={10} pY={10} style={button} href={props.passwordResetUrl}>
          Reset your password
        </Button>
        <Text>
          If you did not request a password reset, please ignore this email or reply to let us know.
          This password reset is only valid for the next 30 minutes.
        </Text>
        <Hr />
        <Text>
          Thanks,
          <br />
          The {account.name} Team
        </Text>
      </Container>
    </EmailLayout>
  );
}

const button = {
  backgroundColor: '#656ee8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
};

export default ResetPasswordEmail;
