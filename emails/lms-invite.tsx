import { Head } from '@react-email/head';
import { Button } from '@react-email/button';
import { Container } from '@react-email/container';
import { Heading } from '@react-email/heading';
import { Hr } from '@react-email/hr';
import { Text } from '@react-email/text';
import account from '../lib/data/account';
import EmailLayout from './email-layout';

type LMSInviteEmailProps = {
  invitationUrl: string;
  name: string;
};

function LMSInviteEmail(props: LMSInviteEmailProps) {
  return (
    <EmailLayout>
      <Head>
        <title>Invitation to Join Our Learning Management System (LMS) - {account.name}</title>
      </Head>
      <Container>
        <Heading>Invitation to Join Our Learning Management System (LMS) - {account.name}</Heading>
        <Text>Hello {props.name},</Text>
        <Text>
          You have been invited to join our Learning Management System (LMS) - {account.name}. Use
          the links below to set up your password and get started.
        </Text>
        <Button pX={10} pY={10} style={button} href={props.invitationUrl}>
          Reset your password
        </Button>
        <Button
          pX={10}
          pY={10}
          style={{
            ...button,
            marginTop: '10px',
            backgroundColor: '#fff',
            color: '#656ee8',
            border: '1px solid #656ee8',
          }}
          href={process.env.NEXT_PUBLIC_FRONTEND_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Login to {account.name}
        </Button>
        <Text>If you have any questions, please contact us at {account.supportEmail}</Text>
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

export default LMSInviteEmail;
