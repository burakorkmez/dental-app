'use client';

import { useActionState } from 'react';

import { addVisitNote } from './actions';

/** Post-op notes: what the patient reads at 11pm instead of phoning the clinic. */
export function AddNoteForm({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState(addVisitNote, null);

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <textarea
        name="body"
        rows={2}
        required
        maxLength={5000}
        placeholder="Post-op instructions the patient will see in the app…"
        className="w-full resize-y rounded-[14px] border border-hairline bg-white p-3.5 text-[13.5px] text-navy placeholder:text-muted/70 focus:border-aqua/50 focus:outline-none focus:ring-4 focus:ring-aqua/10"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-aqua rounded-full px-4 py-2 text-[13px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Add note'}
        </button>
        {state && 'error' in state && state.error && (
          <span className="text-[12px] text-coral">{state.error}</span>
        )}
        {state && 'ok' in state && state.ok && (
          <span className="text-[12px] font-medium text-success">Saved</span>
        )}
      </div>
    </form>
  );
}
