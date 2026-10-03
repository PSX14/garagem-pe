import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const MAX_PHOTOS = 5;

function photoDirectory(): string {
  if (!FileSystem.documentDirectory) throw new Error('O armazenamento de fotos não está disponível neste aparelho.');
  return `${FileSystem.documentDirectory}garagem-pe-photos/`;
}

/** Copies picker cache files into the app's persistent, private document directory. */
export async function pickGaragePhotos(existingCount: number): Promise<string[]> {
  const remaining = MAX_PHOTOS - existingCount;
  if (remaining <= 0) throw new Error('Você pode adicionar até 5 fotos por vaga. Remova uma foto para adicionar outra.');
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('O acesso às fotos foi negado. Permita o acesso nas configurações do Android ou continue com a ilustração da vaga.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.8,
  }).catch(() => { throw new Error('Não foi possível abrir a galeria. Tente novamente ou continue com a ilustração da vaga.'); });
  if (result.canceled) return [];
  const directory = photoDirectory();
  const copied: string[] = [];
  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    for (const [index, asset] of result.assets.slice(0, remaining).entries()) {
      const sourceExtension = asset.fileName?.split('.').pop()?.toLowerCase();
      const extension = sourceExtension && /^(jpe?g|png|webp|heic|heif)$/.test(sourceExtension) ? sourceExtension : 'jpg';
      const destination = `${directory}${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${index}.${extension}`;
      copied.push(destination);
      await FileSystem.copyAsync({ from: asset.uri, to: destination });
    }
    return copied;
  } catch {
    // A failed copy may have left a partial file; include every attempted target.
    await removeGaragePhotos(copied).catch(() => undefined);
    throw new Error('Não foi possível guardar as fotos no aparelho. Confira o espaço disponível e tente novamente.');
  }
}

/** Only removes files owned by this service; never the originals in the gallery. */
export async function removeGaragePhotos(uris: readonly string[]): Promise<void> {
  const directory = photoDirectory();
  await Promise.all(uris.filter(uri => uri.startsWith(directory) && /^[a-zA-Z0-9_-]+\.(jpe?g|png|webp|heic|heif)$/.test(uri.slice(directory.length))).map(uri =>
    FileSystem.deleteAsync(uri, { idempotent: true }),
  ));
}
