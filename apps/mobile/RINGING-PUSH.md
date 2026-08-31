# Ringing — what works now, and what push adds

Calling is built and wired. This file records the one part that cannot be
finished from a checkout: waking a **backgrounded or killed** app with a
ringing push.

## What works today, with no extra credentials

Both sides hold a live Stream Video WebSocket from app start (`src/lib/stream.tsx`
mounts `StreamVideo` at the root). So while **both apps are open**:

- Either side taps the call button → `call.getOrCreate({ ring: true })`.
- The `RingingCalls` watcher at the root picks the call up through `useCalls()`
  and renders `RingingCallContent` over whatever screen is showing.
- The callee gets accept / decline; the caller gets the outgoing ringing UI and
  can cancel. Accepting swaps in the in-call UI without a navigation step.

That is a real, testable calling flow on two dev builds. It is what the demo
script in `PLAN.md` §5 step 3 needs.

## What is missing

If the callee's app is **backgrounded or terminated**, nothing rings. There is
no socket to deliver `call.ring` on. Closing that gap needs a push provider,
which needs credentials this repo does not (and must not) carry:

- **iOS** — an APNs **VoIP** certificate uploaded to the Stream dashboard, and
  an app built with the Push Notifications capability + `aps-environment`
  entitlement.
- **Android** — a Firebase project, its server credentials in the Stream
  dashboard, and `google-services.json` in the repo.

Adding the Firebase config plugins *without* those files breaks
`npx expo prebuild`, so they are deliberately not installed yet.

## The upgrade, in order

1. **Stream dashboard** → add push providers. Note the provider *names* you
   give them; `setPushConfig` refers to them by name, and a mismatch fails
   silently.
2. Install:
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/messaging \
     @stream-io/react-native-callingx
   ```
3. Drop `google-services.json` and `GoogleService-Info.plist` in `apps/mobile/`
   and point `android.googleServicesFile` / `ios.googleServicesFile` at them in
   `app.json`. (The iOS plist is required by react-native-firebase even though
   iOS ringing goes over PushKit, not FCM.)
4. `app.json`: add `"ringing": true` to the `@stream-io/video-react-native-sdk`
   plugin entry, add `"ios": { "entitlements": { "aps-environment": "production" } }`,
   add the two firebase plugins, and extend `expo-build-properties` with
   `"ios": { "useFrameworks": "static", "forceStaticLinking": ["RNFBApp", "RNFBMessaging", "stream-react-native-webrtc"] }`.
5. Add `firebase.json` at the app root with
   `{"react-native":{"messaging_ios_auto_register_for_remote_messages":false}}`.
6. Add `setFirebaseListeners.android.ts` (calling `firebaseDataHandler` for
   `isFirebaseStreamVideoMessage` payloads) plus a no-op `setFirebaseListeners.ts`
   for iOS.
7. Add `setPushConfig.ts` calling `StreamVideoRN.setPushConfig({ ... })` with
   `shouldRejectCallWhenBusy: true` and a `createStreamVideoClient` callback.
8. Create an `index.js` that calls `setPushConfig()` and `setFirebaseListeners()`
   **before** `import 'expo-router/entry'`, and point `"main"` at it in
   `package.json`. Push can arrive before React mounts, so this cannot live in a
   component.
9. `npx expo prebuild --clean`, then build to **physical devices** — APNs does
   not work in the simulator.

### The awkward bit, called out in advance

`createStreamVideoClient` runs outside React, from a cold JS start, so it cannot
use `useAuth()` to get a Clerk token. It has to rebuild the client on its own.
Plan for that when you get there:

- Persist the Stream `userId` and display name to `expo-secure-store` whenever
  `POST /api/stream/token` succeeds in `src/lib/stream.tsx`.
- In `createStreamVideoClient`, read them back and build a `tokenProvider` that
  loads Clerk headlessly (`Clerk.load()` against the same token cache) and hits
  `/api/stream/token` with the resulting session token.
- If either read fails, return `undefined` — the SDK then skips the push rather
  than crashing on a cold start.

Do not shortcut this by caching a long-lived Stream token on the device; that
re-introduces the impersonation risk the server-derived user id exists to
prevent.

## Testing ringing properly

Two physical devices, one signed in as a patient and one as a staff member
(role set in Clerk `publicMetadata`). Release builds without Metro give the
truest behaviour:

```bash
npx expo run:ios --no-bundler --device --configuration Release
```

Android 13+ additionally needs the runtime `POST_NOTIFICATIONS` grant before
any incoming-call notification will display.
