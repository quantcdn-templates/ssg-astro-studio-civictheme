import { describe, it, expect } from 'vitest';
import { cleanPath, ogImagePath } from '../src/lib/url';

describe('cleanPath', () => {
  it('maps the built file paths back to their clean public paths', () => {
    expect(cleanPath('/index.html')).toBe('/');
    expect(cleanPath('/events.html')).toBe('/events');
    expect(cleanPath('/news/new-library-hours.html')).toBe('/news/new-library-hours');
  });

  it('strips the trailing slash that build.format directory puts on the pathname', () => {
    expect(cleanPath('/events/')).toBe('/events');
    expect(cleanPath('/news/new-library-hours/')).toBe('/news/new-library-hours');
  });

  it('leaves a path that has no .html suffix unchanged', () => {
    expect(cleanPath('/')).toBe('/');
    expect(cleanPath('/events')).toBe('/events');
  });
});

describe('ogImagePath', () => {
  it('mirrors the page path, with the home page at /og/home.png', () => {
    expect(ogImagePath('/index.html')).toBe('/og/home.png');
    expect(ogImagePath('/')).toBe('/og/home.png');
    expect(ogImagePath('/about-us')).toBe('/og/about-us.png');
    expect(ogImagePath('/news/new-library-hours.html')).toBe('/og/news/new-library-hours.png');
    expect(ogImagePath('/about-us/')).toBe('/og/about-us.png');
  });
});
