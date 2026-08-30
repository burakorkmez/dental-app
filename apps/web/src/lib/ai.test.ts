import { afterEach, describe, expect, it } from 'vitest';

import { externalTransmissionApproved, isEmergency } from './ai';

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
