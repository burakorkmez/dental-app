'use client';

import { useTransition } from 'react';

import { completeAppointment } from './actions';

/** Marking a visit complete is what moves it into the patient's visit history. */
export function CompleteButton({ appointmentId }: { appointmentId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void completeAppointment(appointmentId))}
      className="btn-glass rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Mark complete'}
    </button>
  );
}
