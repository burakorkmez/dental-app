/**
 * Stream Chat v9 ships empty `Custom*Data` interfaces for apps to augment.
 * Mirrors apps/web/src/types/stream.d.ts — both sides must agree on the custom
 * fields the API writes and this app reads.
 */
declare module 'stream-chat' {
  interface CustomChannelData {
    /** The patient's name — what staff see in the shared inbox. */
    name?: string;
  }
  interface CustomUserData {
    /** Lets either app label a participant as clinic-side without a lookup. */
    staff?: boolean;
  }
}

export {};
