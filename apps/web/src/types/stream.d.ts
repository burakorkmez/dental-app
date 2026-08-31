/**
 * Stream Chat v9 ships empty `Custom*Data` interfaces for apps to augment.
 * Without this, `channel.data.name` and `user.staff` are type errors even
 * though the API accepts them.
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
