/**
 * Is Stream actually reachable with the credentials in .env?
 *
 *   npm run stream:check -w apps/web
 *
 * Written because "Messaging is offline" in the app can mean five different
 * things, and only one of them is a bug in our code. This tells them apart:
 * a bad key, a bad secret, and an app whose backend isn't serving all look
 * identical from the phone.
 */
import { StreamChat } from 'stream-chat';

const KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const SECRET = process.env.STREAM_API_SECRET;

async function main() {
  if (!KEY || !SECRET) {
    console.error('✗ NEXT_PUBLIC_STREAM_API_KEY / STREAM_API_SECRET not set in apps/web/.env');
    process.exit(1);
  }
  console.log(`api key: ${KEY.slice(0, 4)}… (${KEY.length} chars)   secret: ${SECRET.length} chars`);

  try {
    const res = await StreamChat.getInstance(KEY, SECRET).getAppSettings();
    const app = res.app as { name?: string; channel_configs?: Record<string, unknown> } | undefined;
    console.log(`✓ Stream reachable — app "${app?.name ?? '(unnamed)'}"`);
    console.log(`  channel types: ${Object.keys(app?.channel_configs ?? {}).join(', ') || '(none)'}`);
    console.log('\nCredentials are live. Next: npm run db:seed:stream -w apps/web');
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    console.error(`✗ Stream call failed (HTTP ${status ?? '?'})`);

    // The status code is the whole diagnosis — don't make the next person guess.
    if (status === 401) {
      console.error('  401 = the key resolves but the SECRET is wrong. Re-copy both from the');
      console.error('  same app in the dashboard; a key from one app and a secret from another');
      console.error('  fails exactly like this.');
    } else if (status === 503) {
      console.error('  503 "no healthy upstream" = auth PASSED, then Stream had no backend to');
      console.error('  route to. Your credentials are correct; the app itself is not serving.');
      console.error('  Usually a just-created app still provisioning, or a bad region.');
      console.error('  Wait a few minutes and re-run. If it persists, recreate the app (region');
      console.error('  US East) or ask https://getstream.io/contact/.');
    } else {
      console.error(`  ${(err as Error)?.message ?? err}`);
    }
    process.exit(1);
  }
}

main();
