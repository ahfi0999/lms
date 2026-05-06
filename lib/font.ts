import { Source_Code_Pro, Inter } from 'next/font/google';

const sourceCodeProFont = Source_Code_Pro({
  subsets: ['latin'],
});

const interFont = Inter({
  subsets: ['latin'],
});

export const monospaceFontStyle = sourceCodeProFont.style;
export const primaryFontStyle = interFont.style;
