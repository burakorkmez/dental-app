/**
 * Education and triage only.
 *
 * NO PATIENT RECORD IS EVER SENT TO OPENAI. Nothing in this file reads the
 * patients or medical_histories tables, and nothing that calls it may pass one
 * in. That keeps PHI out of the model entirely and OpenAI off the BAA path.
 */

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
  /\b(face|facial|cheek|jaw|neck|throat|eye)\s+(is\s+)?(swollen|swelling)/i,
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
