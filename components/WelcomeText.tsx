import {
  Blockquote,
  Box,
  Center,
  Flex,
  Stack,
  Text,
  Title,
  clsx,
  createStyles,
  keyframes,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';

const brightenGradientKeyframes = keyframes({
  '0%': { filter: 'brightness(100%)' },
  '25%': { filter: 'brightness(150%)' },
  '50%': { filter: 'brightness(200%)' },
  '75%': { filter: 'brightness(150%)' },
  '100%': { filter: 'brightness(100%)' },
});

const useStyles = createStyles((theme) => ({
  brightenGradientAnimation: {
    animation: `${brightenGradientKeyframes} 1s linear infinite`,
  },

  wrapText: {},
}));

const titleParts = ['Learn', 'Do', 'Grow'] as const;

const titlePartGradients = {
  Learn: {
    from: 'hsl(0, 100%, 50%)',
    to: 'hsl(30, 100%, 50%)',
  },
  Do: {
    from: 'hsl(120, 100%, 50%)',
    to: 'hsl(150, 100%, 50%)',
  },
  Grow: {
    from: 'hsl(240, 100%, 50%)',
    to: 'hsl(270, 100%, 50%)',
  },
} as const;

type WelcomeTextProps = {
  quote: string;
  author: string;
};

function WelcomeText(props: WelcomeTextProps) {
  const { classes } = useStyles();

  const [textToAnimate, setTextToAnimate] = useState<(typeof titleParts)[number]>('Learn');

  useEffect(() => {
    const interval = setInterval(() => {
      setTextToAnimate((prev) => {
        const currentIndex = titleParts.indexOf(prev);
        const nextIndex = currentIndex === titleParts.length - 1 ? 0 : currentIndex + 1;
        return titleParts[nextIndex];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const isSmallScreen = useMediaQuery('(max-width: 600px)');
  const verticleAlignText = useMediaQuery('(max-width: 1250px)');

  return (
    <Stack py="xl" spacing={0}>
      <Flex direction={verticleAlignText ? 'column' : 'row'} justify="center" align="center">
        {titleParts.map((part, index) => (
          <Text
            component="span"
            key={part}
            variant={textToAnimate === part ? 'gradient' : undefined}
            pr="xs"
            fw={900}
            p={0}
            m={0}
            lh={1}
            size={isSmallScreen ? '5rem' : '10rem'}
            className={clsx({
              [classes.brightenGradientAnimation]: textToAnimate === part,
            })}
            gradient={{
              from: titlePartGradients[part].from,
              to: titlePartGradients[part].to,
              deg: 129,
            }}
          >
            {part}
            {'.'}
          </Text>
        ))}
      </Flex>
      <Center>
        <Blockquote px={0} cite={`- ${props.author}`}>
          <Text size="xl">{props.quote}</Text>
        </Blockquote>
      </Center>
    </Stack>
  );
}

export default WelcomeText;
