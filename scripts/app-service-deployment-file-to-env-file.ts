// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { keys } from './keys';

function main() {
  const envFileStre = keys.reduce((acc, key) => {
    return (
      acc +
      `            
      - name: ${key.name}
        value: ${key.value}
`
    );
  }, '');

  console.log(envFileStre);
}

main();
