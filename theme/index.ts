import { MantineThemeOverride } from '@mantine/core';
import { monospaceFontStyle, primaryFontStyle } from '../lib/font';

const theme: MantineThemeOverride = {
  colorScheme: 'light',
  fontFamily: primaryFontStyle.fontFamily,
  fontFamilyMonospace: monospaceFontStyle.fontFamily,
  headings: {
    fontFamily: primaryFontStyle.fontFamily,
  },
  fontSizes: {},
  components: {
    Paper: {
      defaultProps: {
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
