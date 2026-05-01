import { MantineThemeOverride } from '@mantine/core';
import { sourceCodeProFontStyle, sourceSansProFontStyle } from '../lib/font';

const theme: MantineThemeOverride = {
  colorScheme: 'light',
  fontFamily: sourceSansProFontStyle.fontFamily,
  fontFamilyMonospace: sourceCodeProFontStyle.fontFamily,
  headings: {
    fontFamily: sourceSansProFontStyle.fontFamily,
  },
  fontSizes: {},
  components: {
    Paper: {
      defaultProps: {
        bg: 'white',
        shadow: 'sm',
        radius: 'sm',
      },
    },
    Switch: {
      defaultProps: {},
    },
  },
};

export default theme;
