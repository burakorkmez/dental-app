import { useAuth } from '@clerk/expo';
// RN's built-in fetch buffers the whole body before resolving; this one exposes
// a real ReadableStream, which is what lets the assistant reply arrive live.
import { fetch as streamingFetch } from 'expo/fetch';
import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * The only place the app talks to apps/web. Every request carries the Clerk
 * session token, which `clerkMiddleware()` on the other side turns back into
 * `auth()` (see apps/web/src/proxy.ts).
 *
 * Business logic lives in the API — this file adds none. Labels, durations and
 * `canCancel` arrive pre-computed so the app never has to know CLINIC_TZ.
 */

const BASE = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown };

/**
 * Held in a ref so the fetchers below never change identity: one that churned
 * every render would re-trigger every effect that depends on it.
 */
function useTokenRef() {
  const { getToken } = useAuth();
  const ref = useRef(getToken);
  useEffect(() => {
    ref.current = getToken;
  }, [getToken]);
  return ref;
}

/** Stable across renders, so it can safely be an effect dependency. */
export function useApiClient() {
  const tokenRef = useTokenRef();

  return useCallback(async <T,>(path: string, options?: Options): Promise<T> => {
    const token = await tokenRef.current();
    const res = await fetch(`${BASE}${path}`, {
      method: options?.method ?? 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : null),
      },
      body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, data?.error ?? 'Something went wrong', data?.code);
    }
    return data as T;
  }, [tokenRef]);
}

/**
 * POST that reports the reply as it arrives. `onText` is called with the whole
 * answer so far on every chunk, so the caller renders a growing message rather
 * than stitching deltas together itself. Resolves with the conversation id.
 *
 * The API answers in JSON right up until the model actually starts generating —
 * errors, and the emergency card, which is canned text with nothing to stream.
 * Those arrive whole, in one `onText`.
 */
export function useApiStream() {
  const tokenRef = useTokenRef();

  return useCallback(
    async (path: string, body: unknown, onText: (text: string) => void): Promise<string> => {
      const token = await tokenRef.current();
      const res = await streamingFetch(`${BASE}${path}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : null),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new ApiError(res.status, data?.error ?? 'Something went wrong', data?.code);
        }
        // The body is the other side of a network boundary, not a guarantee:
        // a proxy error page with a JSON content-type must not reach `.content`.
        if (typeof data?.message?.content !== 'string' || typeof data?.conversationId !== 'string') {
          throw new ApiError(res.status, 'The assistant sent back an unreadable reply');
        }
        onText(data.message.content);
        return data.conversationId;
      }

      const conversationId = res.headers.get('X-Conversation-Id');
      if (!res.body || !conversationId) {
        throw new ApiError(res.status, 'The assistant sent back an unreadable reply');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        onText(text);
      }
      return conversationId;
    },
    [tokenRef]
  );
}

/**
 * GET a path, refetching whenever the screen regains focus — that is what keeps
 * home current after a booking without a cache layer. `null` skips the fetch,
 * for a path that depends on something not loaded yet.
 */
export function useApi<T>(path: string | null) {
  const call = useApiClient();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [shown, setShown] = useState(path);

  // A different query is different data: drop what's on screen and show the
  // spinner. A refocus on the SAME path refreshes silently underneath. Adjusted
  // during render, not in an effect — https://react.dev/learn/you-might-not-need-an-effect
  if (shown !== path) {
    setShown(path);
    setData(null);
    setError(null);
    setLoading(path !== null);
  }

  // A refocus or a path change can leave an earlier request in flight; only the
  // newest one is allowed to write, or a slow reply for the old path lands last.
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (path === null) return;
    const seq = ++latest.current;
    try {
      const next = await call<T>(path);
      if (seq !== latest.current) return;
      setData(next);
      setError(null);
    } catch (err) {
      if (seq !== latest.current) return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      if (seq === latest.current) setLoading(false);
    }
  }, [call, path]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { data, error, loading, reload };
}

// --- API shapes -------------------------------------------------------------
// Mirrors of what the Route Handlers return. Not shared types: there is one
// consumer of each and no packages/shared (PLAN.md D1).

export type Patient = {
  id: string;
  isSelf: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string | null;
  gender: string | null;
  primaryConcern: string | null;
  referralSource: string | null;
};

export type FamilyMember = {
  id: string;
  firstName: string;
  lastName: string;
  isSelf: boolean;
};

export type Me = {
  userId: string;
  email: string | null;
  role: 'patient' | 'staff' | 'dentist';
  hasOnboarded: boolean;
  self: Patient | null;
  family: FamilyMember[];
};

export type Service = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  isTeleconsult: boolean;
};

export type Dentist = {
  id: string;
  displayName: string;
  title: string | null;
  specialty: string | null;
  bio?: string | null;
  photoUrl: string | null;
};

export type Slot = {
  dentistId: string;
  startsAt: string;
  endsAt: string;
  /** Clinic-local "10:30 AM", formatted server-side. */
  label: string;
};

export type MedicalHistory = {
  allergies: string[];
  medications: string[];
  conditions: string[];
  isSmoker: boolean;
  isPregnant: boolean;
  anxietyLevel: number | null;
  notes: string | null;
};

export type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'booked' | 'cancelled' | 'completed' | 'no_show';
  isTeleconsult: boolean;
  streamCallId: string | null;
  /** Decided server-side by the 24-hour rule — the client only hides the button. */
  canCancel: boolean;
  /** "Fri, May 24, 2024" and "10:30 AM", already in clinic time. */
  dateLabel: string;
  timeLabel: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  dentist: Dentist | null;
  service: { id: string; key: string; name: string; durationMinutes: number; isTeleconsult: boolean } | null;
  notes?: { id: string; body: string; createdAt: string }[];
};

// --- Who am I ---------------------------------------------------------------

type MeState = { me: Me | null; loading: boolean; error: string | null; refresh: () => Promise<void> };

const MeContext = createContext<MeState>({
  me: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

/**
 * `GET /api/me` once, at the root. It answers "who is this, has onboarding run,
 * and who is in the family" — three things nearly every screen needs, so
 * fetching it per screen would be the same call five times over.
 */
export function MeProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const call = useApiClient();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [wasSignedIn, setWasSignedIn] = useState(isSignedIn);

  // Signing out — or switching account — must not leave the previous patient's
  // record on screen while the next `/api/me` is still in flight.
  if (wasSignedIn !== isSignedIn) {
    setWasSignedIn(isSignedIn);
    setMe(null);
    setError(null);
    setFetched(false);
  }

  const refresh = useCallback(() => {
    if (!isSignedIn) return Promise.resolve();
    return call<Me>('/api/me').then(
      (next) => {
        setMe(next);
        setError(null);
        setFetched(true);
      },
      (err: unknown) => {
        // Deliberately NOT falling back to a null `me`: that reads as "not
        // onboarded" and would walk a returning patient through onboarding again.
        setError(err instanceof Error ? err.message : 'Could not reach the clinic');
        setFetched(true);
      }
    );
  }, [call, isSignedIn]);

  useEffect(() => {
    if (isLoaded) void refresh();
  }, [isLoaded, refresh]);

  const loading = !isLoaded || (Boolean(isSignedIn) && !fetched);

  return (
    <MeContext.Provider value={{ me, loading, error, refresh }}>{children}</MeContext.Provider>
  );
}

export const useMe = () => useContext(MeContext);
