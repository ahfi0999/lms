import { BlobSASPermissions, BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';

import logger from './logger';

const getBlobServiceClient = () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  return blobServiceClient;
};

const getContainerName = (access: 'private' | 'public') => {
  // Example: lms-private-local
  return `${process.env.AZURE_STORAGE_CONTAINER_PREFIX}-${access}-${process.env.MODE}`;
};

interface IUploadFile {
  path: string;
  mimetype: string;
  name: string;
  access: 'private' | 'public';
}
export const saveFileToAzureStorage = async ({
  path,
  name,
  mimetype,
  access = 'private',
}: IUploadFile) => {
  const blobContainerName = getContainerName(access);

  // Create the BlobServiceClient object which will be used to create a container client
  const blobClient = getBlobServiceClient()
    .getContainerClient(blobContainerName)
    .getBlockBlobClient(`${randomUUID()}-UUIDv4-${name}`); // TODO: Use database to store file name

  try {
    await blobClient.uploadFile(path, {
      blobHTTPHeaders: {
        blobContentType: mimetype,
      },
    });
    return blobClient.url;
  } catch (error) {
    logger.error(error);
    throw Error('Failed to upload image.');
  }
};

export const getAzureBlobAccessUrl = async (privateUrl: string) => {
  // Example privateUrl: https://prodlms.blob.core.windows.net/local-staging-private/4075905.jpg

  const url = new URL(privateUrl);
  const containerName = url.pathname.split('/')[1];
  const blobName = decodeURIComponent(url.pathname.split('/')[2]);

  const blobClient = getBlobServiceClient()
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);

  // Create a SAS token that expires in one hour
  const sasUrl = await blobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: new Date(Date.now() + 60 * 60 * 1000),
  });
  return sasUrl;
};

export const deleteFileFromAzureStorage = async (url: string) => {
  const urlObj = new URL(url);
  const containerName = urlObj.pathname.split('/')[1];
  const blobName = decodeURIComponent(urlObj.pathname.split('/')[2]);

  logger.info('Deleteting blob', blobName);

  const blobClient = getBlobServiceClient()
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);

  try {
    await blobClient.delete();
  } catch (error) {
    logger.error(error);
    throw Error('Failed to delete image.');
  }
};
