import { getContentTree } from './files';

// TODO: Fix testing setup so that this test can run
describe.skip('getContentFolderTree', () => {
  it('should return an array of objects representing the directory structure', async () => {
    const result = await getContentTree('');
    expect(result).toEqual([
      {
        name: 'Folder 1',
        slug: 'folder-1',
        path: expect.any(String),
        children: [
          {
            name: 'File 1',
            slug: 'file-1',
            path: expect.any(String),
          },
          {
            name: 'File 2',
            slug: 'file-2',
            path: expect.any(String),
          },
        ],
      },
      {
        name: 'Folder 2',
        slug: 'folder-2',
        path: expect.any(String),
        children: [
          {
            name: 'Subfolder 1',
            slug: 'subfolder-1',
            path: expect.any(String),
            children: [
              {
                name: 'File 3',
                slug: 'file-3',
                path: expect.any(String),
              },
            ],
          },
          {
            name: 'File 4',
            slug: 'file-4',
            path: expect.any(String),
          },
        ],
      },
      {
        name: 'File 5',
        slug: 'file-5',
        path: expect.any(String),
      },
    ]);
  });

  it('should return an empty array if the folder is empty', async () => {
    const result = await getContentTree('empty-folder');
    expect(result).toEqual([]);
  });

  it('should throw an error if the folder does not exist', async () => {
    await expect(getContentTree('non-existent-folder')).rejects.toThrow();
  });
});
