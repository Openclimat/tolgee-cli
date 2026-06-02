import { parseExtraHeadersArg } from '#cli/utils/extraHeaders.js';

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
