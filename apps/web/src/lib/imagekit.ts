import ImageKit from 'imagekit';

import { ApiError, badRequest } from './http';

/**
 * Patient photos are PRIVATE on ImageKit (PLAN.md §1 HIPAA posture): the stored
 * file is unreachable without a signed, expiring URL. Dentist headshots and
 * marketing images live in a public folder and must never come through here.
 *
 * One file is stored per photo. The blurred thumbnail the thread shows and the
 * full image a tap reveals are both the URL-based transformation API rendering
 * that same file on delivery — ImageKit signs the transformation string along
 * with the path, so they are two separately signed URLs, not two uploads.
 */

/** Per-user, so clearing one patient's history is a single `deleteFolder`. */
export const photoFolder = (userId: string) => `/patient-uploads/ai/${userId}`;

/** X-rays and documents attached while booking. Private, same as the above. */
export const attachmentFolder = (userId: string) => `/patient-uploads/appointments/${userId}`;

/**
 * Delivery URLs are minted fresh on every read, so this only has to outlive a
 * screen someone is looking at, not the message itself.
 */
const URL_TTL_SECONDS = 60 * 60;

let client: ImageKit | null = null;

export function imagekit(): ImageKit {
  if (client) return client;

  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new ApiError(503, 'Photo upload is not configured yet.', 'imagekit_unconfigured');
  }

  client = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
  return client;
}

export type SignedPhoto = { blurred: string; full: string };

/**
 * `bl-40` is a Gaussian blur radius, applied after the resize in the same
 * transformation step — so the preview is rendered small and then blurred,
 * which is both cheaper and less recoverable than blurring at full size.
 *
 * ponytail: both URLs go to the client at once, so the reveal is instant and
 * the blur is a privacy screen against a shoulder or a scroll-past, not an
 * access control — the file itself is what the private folder protects. Withhold
 * `full` until a second request if it ever has to survive a determined viewer.
 */
export function signedPhoto(path: string): SignedPhoto {
  const ik = imagekit();
  const sign = (transformation: Record<string, string>[]) =>
    ik.url({ path, transformation, signed: true, expireSeconds: URL_TTL_SECONDS });

  return {
    blurred: sign([{ width: '400', blur: '40' }]),
    full: sign([{ width: '1200' }]),
  };
}

/** Under Vercel's 4.5MB request body limit. The app resizes to ~300KB first. */
const MAX_BYTES = 4 * 1024 * 1024;

/** Extension comes from the declared type, never from the client's filename. */
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/**
 * Validates a multipart image part and stores it in a private folder, returning
 * the stored path.
 *
 * The bytes go through the server rather than straight from the phone to
 * ImageKit (PLAN.md D19). ImageKit's client-upload signature authorises *an*
 * upload, not a destination — the folder, `isPrivateFile` and the filename all
 * ride in the client's own request, so a signed-params flow would let any
 * signed-in patient write a public file anywhere in the media library,
 * including over `/dentists`. Server-side upload is the only place those are
 * ours to set. `useUniqueFileName` means the client never influences the stored
 * path, so there is nothing to traverse and nothing to overwrite.
 */
export async function uploadPrivateImage(file: unknown, folder: string): Promise<string> {
  if (!(file instanceof File)) throw badRequest('No photo attached');

  const ext = TYPES[file.type];
  if (!ext) throw badRequest('That file type is not supported — send a photo.');
  if (file.size === 0) throw badRequest('That photo is empty.');
  if (file.size > MAX_BYTES) throw badRequest('That photo is too large.');

  const uploaded = await imagekit().upload({
    file: Buffer.from(await file.arrayBuffer()),
    fileName: `photo.${ext}`,
    folder,
    isPrivateFile: true,
    useUniqueFileName: true,
  });
  return uploaded.filePath;
}

/**
 * The clinic's mark, burned into every render of a patient's booking upload —
 * an X-ray that gets screenshotted or forwarded carries where it came from.
 *
 * A text layer, so there is no logo file to keep in sync, anchored to the
 * top-right corner of the base image. `fs-bw_div_25` is a font size relative to
 * the *base* width, which is what keeps the mark the same relative size on the
 * 400px thumbnail and the 1400px render — it is applied in a chained step, so
 * `bw` is the resized image, not the original upload.
 */
const BRAND =
  'l-text,i-Dentify,fs-bw_div_25,co-FFFFFF,bg-0A254075,pa-10_18,r-10,lx-N24,ly-24,lap-top_right,l-end';

export type SignedAttachment = { thumb: string; full: string };

export function signedAttachment(path: string): SignedAttachment {
  const ik = imagekit();
  const sign = (width: string) =>
    ik.url({
      path,
      transformation: [{ width }, { raw: BRAND }],
      signed: true,
      expireSeconds: URL_TTL_SECONDS,
    });

  return { thumb: sign('400'), full: sign('1400') };
}
