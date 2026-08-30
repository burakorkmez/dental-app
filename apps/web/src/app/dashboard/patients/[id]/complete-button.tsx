'use client';

import { useState, useTransition } from 'react';

import { completeAppointment } from './actions';

/** Marking a visit complete is what moves it into the patient's visit history. */
export function CompleteButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {error && <span className="text-[12px] text-coral">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await completeAppointment(appointmentId);
            setError(result.error ?? null);
          })
        }
        className="btn-glass rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Mark complete'}
      </button>
    </>
  );
}
