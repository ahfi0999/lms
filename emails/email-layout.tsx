import { Html } from '@react-email/html';

type EmailLayoutProps = {
  children: React.ReactNode;
};

function EmailLayout(props: EmailLayoutProps) {
  return <Html lang="en">{props.children}</Html>;
}

export default EmailLayout;
