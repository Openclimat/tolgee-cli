import { InvalidArgumentError } from 'commander';

export function parseExtraHeadersArg(value: string): Record<string, string> {
  const trimmed = value.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new InvalidArgumentError(
        'Extra headers JSON could not be parsed. Expected JSON object of string keys to string values.'
      );
    }
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      Object.values(parsed).some((v) => typeof v !== 'string')
    ) {
      throw new InvalidArgumentError(
        'Extra headers JSON must be an object mapping header names to string values.'
      );
    }
    return parsed as Record<string, string>;
  }

  const out: Record<string, string> = {};
  for (const pair of trimmed.split(',')) {
    const segment = pair.trim();
    if (!segment) continue;
    const idx = segment.indexOf('=');
    if (idx <= 0) {
      throw new InvalidArgumentError(
        `Invalid extra header "${segment}". Use Name=Value or pass a JSON object.`
      );
    }
    out[segment.slice(0, idx).trim()] = segment.slice(idx + 1).trim();
  }
  return out;
}

export function getCloudflareAccessHeaders(): Record<string, string> {
  const id = process.env.CF_ACCESS_CLIENT_ID;
  const secret = process.env.CF_ACCESS_CLIENT_SECRET;
  if (!id || !secret) return {};
  return {
    'CF-Access-Client-Id': id,
    'CF-Access-Client-Secret': secret,
  };
}

export function resolveExtraHeaders(
  fromOption: Record<string, string> | string | undefined
): Record<string, string> | undefined {
  const parsedOption =
    typeof fromOption === 'string'
      ? parseExtraHeadersArg(fromOption)
      : fromOption;
  const merged = {
    ...getCloudflareAccessHeaders(),
    ...(parsedOption ?? {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}
