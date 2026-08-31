import { DrizzleQueryError } from 'drizzle-orm/errors';
import { describe, expect, it } from 'vitest';

import { json, scrubQuery } from './http';

/**
 * The message Drizzle throws carries the bound parameters, and the bound
 * parameters are patient rows. This is the guard between that and a Sentry
 * event, so it is checked against a real `DrizzleQueryError` rather than a
 * hand-written string that could drift from the format the ORM actually uses.
 */
describe('scrubQuery', () => {
  it('drops the bound parameters and keeps the SQL', () => {
    const err = new DrizzleQueryError(
      'insert into "patients" ("first_name", "dob") values ($1, $2)',
      ['Yusuf', '1981-04-02'],
      new Error('duplicate key value violates unique constraint')
    );

    const scrubbed = scrubQuery(err.message);

    expect(scrubbed).not.toContain('Yusuf');
    expect(scrubbed).not.toContain('1981-04-02');
    expect(scrubbed).toContain('insert into "patients"');
  });

  it('leaves an error that carries no parameters alone', () => {
    expect(scrubQuery('connect ECONNREFUSED')).toBe('connect ECONNREFUSED');
  });
});

describe('json', () => {
  it('marks every response no-store — they carry signed URLs and patient rows', () => {
    expect(json({ ok: true }).headers.get('Cache-Control')).toBe('no-store');
  });
});
