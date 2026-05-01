import { Anchor, Box, Button, Center, Text, UnstyledButton } from '@mantine/core';
import useGetAzureSasUrl from '../hooks/useGetAzureSasUrl';
import { IconDownload } from '@tabler/icons-react';

type DownloadAzureFileProps = {
  link: string;
  title: string;
};

function DownloadAzureFile(props: DownloadAzureFileProps) {
  const downloadLinkQuery = useGetAzureSasUrl(props.link);

  const downloadFile = () => {
    window.open(downloadLinkQuery.data, '_blank');
  };

  return (
    <UnstyledButton onClick={downloadFile}>
      <Anchor<'div'>>{props.title}</Anchor>
    </UnstyledButton>
  );
}

export default DownloadAzureFile;
