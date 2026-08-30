/**
 * One-off: pushes the seeded dentist headshots to ImageKit's PUBLIC folder and
 * stamps the returned URL onto `dentists.photo_url`.
 *
 *   npx tsx --env-file=.env src/db/upload-dentist-photos.ts
 *
 * Public on purpose: headshots are marketing images, not PHI. Patient dental
 * photos go to a private folder with signed expiring URLs — never here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { eq } from 'drizzle-orm';
import ImageKit from 'imagekit';

import { db } from './index';
import { dentists } from './schema';

const PHOTOS = [
  { displayName: 'Dr. Sarah Johnson', file: 'dr-sarah-johnson.png' },
  { displayName: 'Dr. Marcus Chen', file: 'dr-marcus-chen.png' },
  { displayName: 'Dr. Priya Nair', file: 'dr-priya-nair.png' },
];

const SOURCE_DIR = join(process.cwd(), 'design', 'dentists');

async function main() {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit env vars are not set — see apps/web/.env.example');
  }

  const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });

  for (const p of PHOTOS) {
    const [row] = await db.select().from(dentists).where(eq(dentists.displayName, p.displayName));
    if (!row) {
      console.log(`  skip ${p.displayName} — not seeded`);
      continue;
    }

    const uploaded = await imagekit.upload({
      file: readFileSync(join(SOURCE_DIR, p.file)),
      fileName: p.file,
      folder: '/dentists',
      useUniqueFileName: false, // stable URL, so re-running replaces rather than piles up
      overwriteFile: true,
    });

    await db.update(dentists).set({ photoUrl: uploaded.url }).where(eq(dentists.id, row.id));
    console.log(`  ${p.displayName} → ${uploaded.url}`);
  }

  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
