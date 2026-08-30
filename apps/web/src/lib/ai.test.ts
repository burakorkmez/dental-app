import { afterEach, describe, expect, it } from 'vitest';

import { AI_FALLBACK_REPLY, externalTransmissionApproved, isEmergency, replyStream } from './ai';

describe('isEmergency', () => {
  const emergencies = [
    'my face is swollen and I have trouble breathing',
    'I have facial swelling on the left side',
    'my face is very swollen',
    'my swollen face is getting worse',
    'swelling in my neck since last night',
    "the bleeding won't stop after my extraction",
    'uncontrolled bleeding from the socket',
    'my son knocked out a tooth playing soccer',
    'my tooth got knocked out, what do I do',
    'I think I broke my jaw',
    'hard to swallow and my throat feels tight',
    'fever and tooth pain for two days',
  ];

  const routine = [
    'why does my tooth hurt when I drink cold water?',
    'how often should I floss?',
    'is teeth whitening safe for enamel?',
    'my gums bleed a little when I brush',
    'I have mild jaw soreness in the morning',
    'do I need a filling if there is no pain?',
  ];

  it.each(emergencies)('flags: %s', (msg) => {
    expect(isEmergency(msg)).toBe(true);
  });

  it.each(routine)('does not flag: %s', (msg) => {
    expect(isEmergency(msg)).toBe(false);
  });
});

describe('externalTransmissionApproved — fails closed', () => {
  const original = process.env.OPENAI_TRANSMISSION_APPROVED;
  afterEach(() => {
    if (original === undefined) delete process.env.OPENAI_TRANSMISSION_APPROVED;
    else process.env.OPENAI_TRANSMISSION_APPROVED = original;
  });

  it('blocks when the variable is unset', () => {
    delete process.env.OPENAI_TRANSMISSION_APPROVED;
    expect(externalTransmissionApproved()).toBe(false);
  });

  it.each(['false', '', '1', 'TRUE', 'yes', 'true '])('blocks on %o', (value) => {
    process.env.OPENAI_TRANSMISSION_APPROVED = value;
    expect(externalTransmissionApproved()).toBe(false);
  });

  it('allows only the exact string "true"', () => {
    process.env.OPENAI_TRANSMISSION_APPROVED = 'true';
    expect(externalTransmissionApproved()).toBe(true);
  });
});

describe('replyStream', () => {
  const chunks = (...deltas: (string | null)[]) => ({
    async *[Symbol.asyncIterator]() {
      for (const content of deltas) yield { choices: [{ delta: { content } }] };
    },
  });

  const read = async (s: ReadableStream<Uint8Array>) => {
    const reader = s.getReader();
    const decoder = new TextDecoder();
    let out = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return out;
      out += decoder.decode(value, { stream: true });
    }
  };

  it('streams each delta and hands the whole reply to onDone', async () => {
    let saved = '';
    const body = await read(
      replyStream(chunks('Flossing ', null, 'once a day ', 'is enough.'), async (r) => {
        saved = r;
      })
    );
    expect(body).toBe('Flossing once a day is enough.');
    expect(saved).toBe(body);
  });

  it('falls back when the model streams nothing', async () => {
    let saved = '';
    const body = await read(
      replyStream(chunks(null, ''), async (r) => {
        saved = r;
      })
    );
    expect(body).toBe(AI_FALLBACK_REPLY);
    expect(saved).toBe(AI_FALLBACK_REPLY);
  });

  it('keeps the partial answer when the stream breaks mid-reply', async () => {
    const broken = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: 'Rinse with warm salt water' } }] };
        throw new Error('upstream died');
      },
    };
    let saved = '';
    const body = await read(replyStream(broken, async (r) => {
      saved = r;
    }));
    expect(body).toBe('Rinse with warm salt water');
    expect(saved).toBe(body);
  });
});
