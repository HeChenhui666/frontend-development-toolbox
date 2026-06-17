import { describe, it, expect } from 'vitest';
import { normalizeDomain, getChromeVersion } from '../corsUtils';

describe('normalizeDomain', () => {
  it('returns plain domain unchanged', () => {
    expect(normalizeDomain('localhost')).toBe('localhost');
  });

  it('strips port from domain:port', () => {
    expect(normalizeDomain('localhost:3000')).toBe('localhost');
  });

  it('strips scheme and port from full URL', () => {
    expect(normalizeDomain('https://localhost:3000/')).toBe('localhost');
  });

  it('handles eTLD+1 domain', () => {
    expect(normalizeDomain('my-dev.com')).toBe('my-dev.com');
  });

  it('strips port from eTLD+1 domain', () => {
    expect(normalizeDomain('my-dev.com:8080')).toBe('my-dev.com');
  });

  it('handles HTTPS URL with path', () => {
    expect(normalizeDomain('https://api.example.com/v1/test')).toBe('api.example.com');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeDomain('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeDomain('   ')).toBe('');
  });
});

describe('getChromeVersion', () => {
  it('returns 0 when userAgent has no Chrome version', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      configurable: true,
    });
    expect(getChromeVersion()).toBe(0);
  });

  it('parses major Chrome version from userAgent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0) Chrome/131.0.6778.86 Safari/537.36',
      configurable: true,
    });
    expect(getChromeVersion()).toBe(131);
  });
});
