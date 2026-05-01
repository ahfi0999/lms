import { Center, Container, TypographyStylesProvider } from '@mantine/core';
import Image from 'next/image';

type CourseIntroPageProps = {
  title: string;
  description: string;
  picture: string;
};

function CourseIntroPage(props: CourseIntroPageProps) {
  return (
    <Container fluid>
      <TypographyStylesProvider>
        <h1>{props.title}</h1>
        <Center>
          <Image
            src={props.picture}
            alt={props.title}
            style={{ margin: '40px 0px' }}
            width={300}
            height={300}
          />
        </Center>
        <p>{props.description}</p>
      </TypographyStylesProvider>
    </Container>
  );
}

export default CourseIntroPage;
