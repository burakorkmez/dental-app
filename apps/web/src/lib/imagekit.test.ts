import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.IMAGEKIT_PUBLIC_KEY = 'public_test';
  process.env.IMAGEKIT_PRIVATE_KEY = 'private_test';
  process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test';
});

/**
 * The blur is the whole feature, and it lives in a string the SDK builds from
 * a key that is easy to get wrong — `blur` maps to `bl`, and a typo silently
 * produces a perfectly readable photo rather than an error.
 */
describe('signedPhoto', () => {
  let photo: { blurred: string; full: string };

  beforeAll(async () => {
    const { signedPhoto } = await import('./imagekit');
    photo = signedPhoto('/patient-uploads/ai/user-1/photo_abc.jpg');
  });

  it('blurs the preview and does not blur the reveal', () => {
    expect(photo.blurred).toContain('bl-40');
    expect(photo.full).not.toContain('bl-');
  });

  it('renders the preview small, so the blur is cheap and unrecoverable', () => {
    expect(photo.blurred).toContain('w-400');
    expect(photo.full).toContain('w-1200');
  });

  it('serves both from the one stored file', () => {
    for (const url of [photo.blurred, photo.full]) {
      expect(url).toContain('/patient-uploads/ai/user-1/photo_abc.jpg');
    }
  });

  it('signs and expires both — a private file is unreachable without it', () => {
    for (const url of [photo.blurred, photo.full]) {
      expect(url).toMatch(/ik-t=\d+/);
      expect(url).toMatch(/ik-s=[0-9a-f]+/);
    }
    // Different transformations, so different signatures: one cannot be
    // rewritten into the other by editing the URL.
    expect(new URL(photo.blurred).searchParams.get('ik-s')).not.toBe(
      new URL(photo.full).searchParams.get('ik-s')
    );
  });
});

/**
 * The clinic's mark on a patient's booking upload is a hand-written
 * transformation string — a typo in it is not an error, it is a perfectly good
 * image with no branding on it, which nobody would notice.
 */
describe('signedAttachment', () => {
  let file: { thumb: string; full: string };

  beforeAll(async () => {
    const { signedAttachment } = await import('./imagekit');
    file = signedAttachment('/patient-uploads/appointments/user-1/photo_abc.jpg');
  });

  it('brands both renders with Dentify, anchored top-right', () => {
    for (const url of [file.thumb, file.full]) {
      expect(url).toContain('l-text,i-Dentify');
      expect(url).toContain('lap-top_right');
      expect(url).toContain('l-end');
    }
  });

  it('applies the mark in a chained step, so its size tracks the render', () => {
    // `w-400:l-text...` — a comma here would size the font off the original
    // upload instead of the resized image.
    expect(file.thumb).toContain('w-400:l-text');
    expect(file.full).toContain('w-1400:l-text');
    expect(file.full).toContain('fs-bw_div_25');
  });

  it('signs and expires both — a private file is unreachable without it', () => {
    for (const url of [file.thumb, file.full]) {
      expect(url).toMatch(/ik-t=\d+/);
      expect(url).toMatch(/ik-s=[0-9a-f]+/);
    }
  });
});
