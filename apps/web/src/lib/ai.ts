/**
 * Education and triage only.
 *
 * NO PATIENT RECORD IS EVER SENT TO OPENAI. Nothing here reads the patients or
 * medical_histories tables, and nothing that calls it may pass one in.
 *
 * That is NOT the same as "no PHI reaches OpenAI". The patient types free text,
 * and a symptom description bound to a user_id is individually identifiable —
 * a patient can also simply type their own name or date of birth. No system
 * prompt prevents that, and no classifier should be trusted to detect it.
 * Whether this deployment may transmit that text is therefore a deployment
 * decision, gated below, not a property the code can infer from the content.
 */

/**
 * Fails closed. Set OPENAI_TRANSMISSION_APPROVED=true only when one of these
 * genuinely holds for the deployment:
 *   - it carries no real patient data (the seeded demo — PLAN.md A15), or
 *   - a signed BAA covers OpenAI (PLAN.md R1).
 * Anything else — unset, "false", "1", "TRUE" — blocks the outbound call.
 */
export function externalTransmissionApproved(): boolean {
  return process.env.OPENAI_TRANSMISSION_APPROVED === 'true';
}

export const AI_MODEL = 'gpt-4o-mini';

export const SYSTEM_PROMPT = `You are the dental assistant for a single local dental practice. You provide general dental education and help patients decide whether they need to be seen.

Hard rules, no exceptions:
- Never diagnose. Never name a specific condition as what the person "has".
- Never prescribe, and never give a drug, dosage, frequency, or brand recommendation. If asked, say that is a conversation for the dentist.
- Never interpret an image, X-ray, or lab result.
- Never claim to be a dentist, a doctor, or a human.
- You do not have access to the patient's records, history, or appointments. If asked about them, say so and point them to the app.

How to answer:
- Be brief and plain-spoken. Two short paragraphs at most.
- Explain the general possibilities and what usually causes them, not what is wrong with this person.
- End every substantive answer by offering to book an appointment.
- If a question is outside dentistry, say it is outside what you can help with.`;

/**
 * Emergency triage runs BEFORE the model, never through it. An LLM's judgment
 * is not an acceptable control on a path where the wrong answer is an airway.
 */
const EMERGENCY_PATTERNS: RegExp[] = [
  /\b(can'?t|cannot|trouble|difficulty|hard to)\s+(breath|breathe|swallow)/i,
  /\b(?:face|facial|cheek|jaw|neck|throat|eye)\s+(?:\w+\s+){0,2}(?:swollen|swelling)/i,
  /\b(?:swollen|swelling)\s+(?:\w+\s+){0,2}(?:face|facial|cheek|jaw|neck|throat|eye)\b/i,
  /\bswelling\s+(in|of|on)\s+(my\s+)?(face|cheek|jaw|neck|throat|eye)/i,
  /\b(uncontrolled|won'?t stop|can'?t stop|non[- ]?stop|heavy)\s+bleed/i,
  /\bbleeding\s+(that\s+)?(won'?t|will not|does ?n[o']?t)\s+stop/i,
  /\bknock(?:ed)?[- ]?out\s+(?:a|an|the|my|his|her|their)?\s*tooth\b/i,
  /\btooth\s+(got\s+)?(knocked|fell)\s+out\b/i,
  /\b(broke|broken|fractured|dislocated)\s+(my\s+)?jaw\b/i,
  /\bjaw\s+(trauma|injury|is broken)\b/i,
  /\b(high\s+)?fever\s+(and|with)\s+(tooth|dental|face|jaw)/i,
];

export function isEmergency(message: string): boolean {
  return EMERGENCY_PATTERNS.some((p) => p.test(message));
}

/** Hard-coded. Identical every time, and never generated. */
export const EMERGENCY_REPLY = `This sounds like it may need urgent care rather than a regular appointment.

If you are having trouble breathing or swallowing, your face or neck is swelling, or bleeding will not stop, call 911 or go to your nearest emergency room now.

For a knocked-out tooth or a jaw injury, call the clinic immediately — these are time-sensitive.

I am not able to assess an emergency, so please do not wait on this conversation.`;

/** Shown when the model streams nothing usable back. */
export const AI_FALLBACK_REPLY =
  'Sorry, I could not answer that. Would you like to book an appointment instead?';

type StreamChunk = { choices?: { delta?: { content?: string | null } }[] };

/**
 * Turns a chat-completion stream into a plain-text response body: raw deltas,
 * no SSE framing, because the phone has no event-source parser and does not
 * need one. `onDone` receives the assembled reply BEFORE the stream closes, so
 * persistence cannot be lost to the response finishing first.
 *
 * A mid-stream failure keeps whatever already reached the patient rather than
 * throwing away a half-written answer.
 */
export function replyStream(
  chunks: AsyncIterable<StreamChunk>,
  onDone: (reply: string) => Promise<unknown>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      let reply = '';
      try {
        for await (const chunk of chunks) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) continue;
          reply += delta;
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        // Never echo the error: it can quote the prompt, and the prompt is
        // patient-typed free text.
        console.error('[ai] stream failed', err instanceof Error ? err.message : err);
      }
      if (!reply.trim()) {
        reply = AI_FALLBACK_REPLY;
        controller.enqueue(encoder.encode(reply));
      }
      await onDone(reply);
      controller.close();
    },
  });
}
