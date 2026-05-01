import { useMutation } from '@tanstack/react-query';
import http from '../lib/http-client';
import { notify } from '../lib/notify';
import useRefreshPageData from './useRefreshPageData';

function useDeleteAttachment() {
  const refreshPageData = useRefreshPageData();
  return useMutation({
    mutationKey: ['deleteAttachment'],
    mutationFn: async (id: number) => {
      const res = await http.delete(`/api/attachments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      notify({
        type: 'success',
        message: 'Attachment deleted successfully',
      });
      refreshPageData();
    },
  });
}
export default useDeleteAttachment;
