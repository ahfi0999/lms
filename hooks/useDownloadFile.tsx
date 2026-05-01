import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';

import http from '../lib/http-client';

const downloadFile = async (endpoint: string) => {
  try {
    const res = await http.get(endpoint, {
      responseType: 'blob',
    });
    const fileName = res.headers['Content-Disposition'].split(';')[1].split('=')[1];
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    return res.data;
  } catch (error) {
    notifications.show({
      title: 'Something went wrong.',
      message: 'Please try again later.',
      color: 'red',
      icon: <IconX />,
    });
  }
};

function useDownloadFile(url: string) {
  const query = useQuery({
    queryKey: ['downloadSampleFile', url],
    queryFn: () => downloadFile(url),
    enabled: false,
  });
  return query;
}

export default useDownloadFile;
