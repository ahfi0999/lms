import { Source_Code_Pro, Source_Sans_3 } from 'next/font/google';

const sourceCodeProFont = Source_Code_Pro({
  subsets: ['latin'],
});

const sourceSans3Font = Source_Sans_3({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
});

export const sourceCodeProFontStyle = sourceCodeProFont.style;
export const sourceSansProFontStyle = sourceSans3Font.style;
