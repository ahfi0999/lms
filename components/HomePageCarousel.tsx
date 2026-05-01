import { Carousel } from '@mantine/carousel';
import { Paper, useMantineTheme } from '@mantine/core';
import Image from 'next/image';

type HomePagePropsProps = {};

function HomePageProps(props: HomePagePropsProps) {
  const theme = useMantineTheme();

  return (
    <Carousel mx="auto" mt="sm" height={250} withIndicators withControls>
      {Array.from({ length: 5 }).map((_, index) => (
        <Carousel.Slide key={index}>
          <Paper withBorder>
            <Image
              src={`/img/carousel/${index + 1}.jpeg`}
              // width={1000}
              // height={250}
              alt="No courses"
              fill
              style={{
                borderRadius: theme.radius.sm,
                objectFit: 'cover',
              }}
              onClick={(e) => {
                // https://github.com/mantinedev/mantine/issues/4174#issuecomment-1540557053
                e.stopPropagation();
              }}
            />
          </Paper>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

export default HomePageProps;
