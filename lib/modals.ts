import UploadAttachmentModal from '../components/UploadAttachmentModal';

const modals = {
  uploadAttachment: UploadAttachmentModal,
};

declare module '@mantine/modals' {
  export interface MantineModalsOverride {
    modals: typeof modals;
  }
}

export default modals;
