import { Head } from '@react-email/head';
import { Button } from '@react-email/button';
import { Container } from '@react-email/container';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Text } from '@react-email/text';
import account from '../lib/data/account';
import EmailLayout from './email-layout';

type VerifyEmailProps = {
  verifyEmailUrl: string;
  name: string;
};

function VerifyEmail(props: VerifyEmailProps) {
  return (
    <EmailLayout>
      <Head>
        <title>Verify your email</title>
      </Head>
      <Container>
        <Heading>Verify your email</Heading>
        <Text>Hello {props.name},</Text>
        <Text>Please verify your email address by clicking the button below.</Text>
        <Button pX={10} pY={10} style={button} href={props.verifyEmailUrl}>
          Verify your email
        </Button>
        <Text>
          If you did not create an account, please ignore this email or reply to let us know.
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

export default VerifyEmail;
