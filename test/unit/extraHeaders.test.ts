import { afterEach, beforeEach } from 'vitest';
import {
  getCloudflareAccessHeaders,
  parseExtraHeadersArg,
  resolveExtraHeaders,
} from '#cli/utils/extraHeaders.js';

describe('parseExtraHeadersArg', () => {
  it('parses JSON object', () => {
    expect(parseExtraHeadersArg('{"X-Foo":"bar","X-Baz":"qux"}')).toEqual({
      'X-Foo': 'bar',
      'X-Baz': 'qux',
    });
  });

  it('parses comma-separated Name=Value pairs', () => {
    expect(parseExtraHeadersArg('X-Foo=bar, X-Baz=qux')).toEqual({
      'X-Foo': 'bar',
      'X-Baz': 'qux',
    });
  });

  it('keeps "=" characters inside the value', () => {
    expect(parseExtraHeadersArg('X-Token=abc=def=ghi')).toEqual({
      'X-Token': 'abc=def=ghi',
    });
  });

  it('returns empty for empty input', () => {
    expect(parseExtraHeadersArg('')).toEqual({});
    expect(parseExtraHeadersArg('   ')).toEqual({});
  });

  it('rejects malformed JSON object', () => {
    expect(() => parseExtraHeadersArg('{not json')).toThrow();
  });

  it('rejects JSON array', () => {
    expect(() => parseExtraHeadersArg('["a","b"]')).toThrow();
  });

  it('rejects JSON with non-string values', () => {
    expect(() => parseExtraHeadersArg('{"X-Foo":1}')).toThrow();
  });

  it('rejects malformed pairs', () => {
    expect(() => parseExtraHeadersArg('not-a-header')).toThrow();
    expect(() => parseExtraHeadersArg('=missing-name')).toThrow();
  });
});

describe('getCloudflareAccessHeaders', () => {
  const originalId = process.env.CF_ACCESS_CLIENT_ID;
  const originalSecret = process.env.CF_ACCESS_CLIENT_SECRET;

  afterEach(() => {
    process.env.CF_ACCESS_CLIENT_ID = originalId;
    process.env.CF_ACCESS_CLIENT_SECRET = originalSecret;
  });

  it('returns empty when env vars missing', () => {
    delete process.env.CF_ACCESS_CLIENT_ID;
    delete process.env.CF_ACCESS_CLIENT_SECRET;
    expect(getCloudflareAccessHeaders()).toEqual({});
  });

  it('returns empty when only one env var set', () => {
    process.env.CF_ACCESS_CLIENT_ID = 'id';
    delete process.env.CF_ACCESS_CLIENT_SECRET;
    expect(getCloudflareAccessHeaders()).toEqual({});
  });

  it('returns CF-Access headers when both set', () => {
    process.env.CF_ACCESS_CLIENT_ID = 'id.access';
    process.env.CF_ACCESS_CLIENT_SECRET = 'shh';
    expect(getCloudflareAccessHeaders()).toEqual({
      'CF-Access-Client-Id': 'id.access',
      'CF-Access-Client-Secret': 'shh',
    });
  });
});

describe('resolveExtraHeaders', () => {
  const originalId = process.env.CF_ACCESS_CLIENT_ID;
  const originalSecret = process.env.CF_ACCESS_CLIENT_SECRET;

  beforeEach(() => {
    delete process.env.CF_ACCESS_CLIENT_ID;
    delete process.env.CF_ACCESS_CLIENT_SECRET;
  });

  afterEach(() => {
    process.env.CF_ACCESS_CLIENT_ID = originalId;
    process.env.CF_ACCESS_CLIENT_SECRET = originalSecret;
  });

  it('returns undefined when nothing configured', () => {
    expect(resolveExtraHeaders(undefined)).toBeUndefined();
  });

  it('merges Cloudflare env vars with explicit option', () => {
    process.env.CF_ACCESS_CLIENT_ID = 'cf-id';
    process.env.CF_ACCESS_CLIENT_SECRET = 'cf-secret';
    expect(resolveExtraHeaders({ 'X-Foo': 'bar' })).toEqual({
      'CF-Access-Client-Id': 'cf-id',
      'CF-Access-Client-Secret': 'cf-secret',
      'X-Foo': 'bar',
    });
  });

  it('explicit option overrides CF env defaults', () => {
    process.env.CF_ACCESS_CLIENT_ID = 'cf-id';
    process.env.CF_ACCESS_CLIENT_SECRET = 'cf-secret';
    expect(resolveExtraHeaders({ 'CF-Access-Client-Id': 'override' })).toEqual({
      'CF-Access-Client-Id': 'override',
      'CF-Access-Client-Secret': 'cf-secret',
    });
  });

  it('accepts string input and parses it', () => {
    expect(resolveExtraHeaders('X-Foo=bar')).toEqual({ 'X-Foo': 'bar' });
  });
});
