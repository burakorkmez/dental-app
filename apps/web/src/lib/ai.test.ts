import { describe, expect, it } from 'vitest';

import { isEmergency } from './ai';

describe('isEmergency', () => {
  const emergencies = [
    'my face is swollen and I have trouble breathing',
    'I have facial swelling on the left side',
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
