import { Alert } from '@mantine/core';

function Unauthorized() {
  return (
    <>
      <Alert color="red" title="Unauthorized">
        You are not authorized to view this page.
      </Alert>
    </>
  );
}

export default Unauthorized;
