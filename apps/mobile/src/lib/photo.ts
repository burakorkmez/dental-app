import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Bounds the upload: a camera-roll photo is several MB, and the API caps at 4. */
const MAX_UPLOAD_WIDTH = 1400;

/** Uploading a photo over a mobile connection outlasts the default 15s budget. */
export const UPLOAD_TIMEOUT_MS = 60_000;

export type PickedPhoto = { uri: string; file: File };

/**
 * Picks images from the library and shrinks them into something an upload can
 * survive. Empty array = the picker was cancelled.
 */
export async function pickPhotos(limit = 1): Promise<PickedPhoto[]> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
  });
  if (picked.canceled) return [];

  // Shrunk before it leaves the phone, not after it arrives: the upload has to
  // survive a mobile connection, and a camera-roll original is megabytes of
  // detail no one will look at through a phone-sized bubble. `min` so a small
  // photo is never upscaled into a bigger file than it started as.
  return Promise.all(
    picked.assets.map(async (asset) => {
      const rendered = await ImageManipulator.manipulate(asset.uri)
        .resize({ width: Math.min(MAX_UPLOAD_WIDTH, asset.width || MAX_UPLOAD_WIDTH) })
        .renderAsync();
      const jpeg = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

      // NOT React Native's `{ uri, name, type }` descriptor: `fetch` here is
      // Expo's, which builds the multipart body in JS and can only read a part
      // it can get bytes out of — a uri it would have to go to the filesystem
      // for throws `Unsupported FormDataPart implementation`. `File` is that
      // readable part, and it carries the name and `image/jpeg` with it.
      return { uri: jpeg.uri, file: new File(jpeg.uri) };
    })
  );
}
