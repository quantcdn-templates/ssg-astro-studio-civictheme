import { describe, it, expect } from 'vitest';
import EventCard from '@civictheme/molecules/EventCard.astro';
import { parityCase, expectAllKeysCovered, renderNormalised } from '../harness';

const meta = { layer: '02-molecules', name: 'event-card' };

const REQUIRED_KEY = 'Event Card Component renders with required attributes 1';
const OPTIONAL_KEY = 'Event Card Component renders with optional attributes 1';
const OBJECT_TAGS_KEY = 'Event Card Component renders tags provided as objects 1';

describe('EventCard', () => {
  parityCase(meta, REQUIRED_KEY, EventCard, {
    title: 'Event Title',
    summary: 'This is a summary of the event.',
    date: '2023-01-01 12:00',
    dateIso: '2023-01-01T12:00:00Z',
    location: 'Event Location',
  });

  parityCase(meta, OPTIONAL_KEY, EventCard, {
    contentTop: 'Top content',
    imageOver: 'Image over content',
    contentMiddle: 'Middle content',
    contentBottom: 'Bottom content',
    image: { url: 'https://example.com/image.jpg', alt: 'Image description' },
    title: 'Event Title',
    summary: 'This is a summary of the event.',
    date: '2023-01-01 12:00',
    dateIso: '2023-01-01T12:00:00Z',
    location: 'Event Location',
    link: { url: 'https://example.com' },
    tags: ['Tag 1', 'Tag 2'],
    theme: 'dark',
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, OBJECT_TAGS_KEY, EventCard, {
    title: 'Event Title',
    tags: [{ content: 'Tag 1', url: 'https://example.com/tag-1' }, { content: 'Tag 2' }],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, OBJECT_TAGS_KEY]);

  // Task 14c: every Slot-documented prop also has an Astro slot that takes
  // precedence over the string prop.
  describe('slot vs string-prop parity', () => {
    it('title: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'Event Title' });
      const viaSlot = await renderNormalised(EventCard, {}, { title: 'Event Title' });
      expect(viaSlot).toBe(viaProp);
    });

    it('imageOver: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', imageOver: 'Over content' });
      const viaSlot = await renderNormalised(EventCard, { title: 'x' }, { imageOver: 'Over content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentTop: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', contentTop: 'Top content' });
      const viaSlot = await renderNormalised(EventCard, { title: 'x' }, { contentTop: 'Top content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('contentMiddle: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', contentMiddle: 'Middle content' });
      const viaSlot = await renderNormalised(EventCard, { title: 'x' }, { contentMiddle: 'Middle content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('location: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', location: 'Event Location' });
      const viaSlot = await renderNormalised(
        EventCard,
        { title: 'x' },
        {
          location:
            '<div class="ct-event-card__location ct-paragraph ct-paragraph--regular ct-theme-light">Event Location</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('summary: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', summary: 'A summary.' });
      const viaSlot = await renderNormalised(
        EventCard,
        { title: 'x' },
        {
          summary:
            '<div class="ct-event-card__summary ct-paragraph ct-paragraph--no-margin ct-paragraph--regular ct-theme-light">A summary.</div>',
        }
      );
      expect(viaSlot).toBe(viaProp);
    });

    it('contentBottom: slot renders identically to the string prop', async () => {
      const viaProp = await renderNormalised(EventCard, { title: 'x', contentBottom: 'Bottom content' });
      const viaSlot = await renderNormalised(EventCard, { title: 'x' }, { contentBottom: 'Bottom content' });
      expect(viaSlot).toBe(viaProp);
    });

    it('a title slot alone (no string prop) still renders the card', async () => {
      const html = await renderNormalised(EventCard, {}, { title: 'Live Title' });
      expect(html).toContain('ct-event-card__title');
      expect(html).toContain('Live Title');
    });
  });
});
