import { Anchor } from '@mantine/core';
import useGetAzureSasUrl from '../hooks/useGetAzureSasUrl';
import { getFileNameFromBlobUrl } from '../lib/strings';

type DownloadFileProps = {
  azureFileUrl: string;
};

function DownloadFile(props: DownloadFileProps) {
  const query = useGetAzureSasUrl(props.azureFileUrl, true);
  const downloadFile = async () => {
    await query.refetch();
  };

  return (
    <Anchor onClick={downloadFile} component="button">
      {getFileNameFromBlobUrl(props.azureFileUrl)}
    </Anchor>
  );
}

export default DownloadFile;
