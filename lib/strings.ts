export const getFileNameFromBlobUrl = (blobUrl: string) => {
  let fileName = '';
  const url = new URL(blobUrl);
  const path = url.pathname;
  fileName = path.substring(path.lastIndexOf('/') + 1);
  fileName = decodeURIComponent(fileName);

  return fileName.split('-UUIDv4-')[1] || fileName;
};
