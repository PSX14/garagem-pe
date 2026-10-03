import { beforeEach, expect, jest, test } from '@jest/globals';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { pickGaragePhotos, removeGaragePhotos } from '../../services/photos';

jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///app/documents/', makeDirectoryAsync: jest.fn(), copyAsync: jest.fn(), deleteAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>);
  jest.mocked(FileSystem.makeDirectoryAsync).mockResolvedValue(undefined);
  jest.mocked(FileSystem.copyAsync).mockResolvedValue(undefined);
  jest.mocked(FileSystem.deleteAsync).mockResolvedValue(undefined);
});

test('selected photos are copied from cache into the private persistent directory', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/picked.png', fileName: 'picked.png', width: 10, height: 10 }] });
  const photos = await pickGaragePhotos(0);
  expect(photos).toHaveLength(1);
  expect(photos[0]).toMatch(/^file:\/\/\/app\/documents\/garagem-pe-photos\/.+\.png$/);
  expect(FileSystem.copyAsync).toHaveBeenCalledWith({ from: 'file:///cache/picked.png', to: photos[0] });
});

test('denied permission reports an actionable message without opening the picker', async () => {
  jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: false } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>);
  await expect(pickGaragePhotos(0)).rejects.toThrow('negado');
  expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
});

test('cancelling the picker does not create or remove files', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
  expect(await pickGaragePhotos(0)).toEqual([]);
  expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
});

test('the five-photo limit stops another picker launch', async () => {
  await expect(pickGaragePhotos(5)).rejects.toThrow('até 5 fotos');
  expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
});

test('cleanup never deletes the original gallery image or another app directory', async () => {
  await removeGaragePhotos(['file:///gallery/original.jpg', 'file:///app/documents/private-file.jpg', 'file:///app/documents/garagem-pe-photos/owned.jpg']);
  expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///app/documents/garagem-pe-photos/owned.jpg', { idempotent: true });
});

test('a failed later copy cleans up earlier copied images', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/a.jpg', width: 10, height: 10 }, { uri: 'file:///cache/b.jpg', width: 10, height: 10 }] });
  jest.mocked(FileSystem.copyAsync).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Disk full'));
  await expect(pickGaragePhotos(0)).rejects.toThrow('guardar as fotos');
  expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
});

test('directory and cleanup failures still return the actionable Portuguese storage message', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/a.jpg', width: 10, height: 10 }] });
  jest.mocked(FileSystem.makeDirectoryAsync).mockRejectedValue(new Error('Permission denied'));
  await expect(pickGaragePhotos(0)).rejects.toThrow('Não foi possível guardar as fotos');
  jest.mocked(FileSystem.makeDirectoryAsync).mockResolvedValue(undefined);
  jest.mocked(FileSystem.copyAsync).mockRejectedValue(new Error('Disk full'));
  jest.mocked(FileSystem.deleteAsync).mockRejectedValue(new Error('Delete failed'));
  await expect(pickGaragePhotos(0)).rejects.toThrow('Não foi possível guardar as fotos');
});
