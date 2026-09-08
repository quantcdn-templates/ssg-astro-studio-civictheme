import { describe } from 'vitest';
import Attachment from '@civictheme/molecules/Attachment.astro';
import { parityCase, expectAllKeysCovered } from '../harness';

const meta = { layer: '02-molecules', name: 'attachment' };

const REQUIRED_KEY = 'Attachment Component renders with required attributes 1';
const OPTIONAL_KEY = 'Attachment Component renders with optional attributes 1';
const EMPTY_KEY = 'Attachment Component does not render when files are empty 1';
const MULTI_KEY = 'Attachment Component renders with multiple files and attributes 1';

const files2 = [
  { name: 'File 1', ext: 'pdf', url: 'https://example.com/file1.pdf', size: '1MB', created: '2023-01-01', changed: '2023-01-02', icon: 'pdf-file' },
  { name: 'File 2', ext: 'docx', url: 'https://example.com/file2.docx', size: '2MB', created: '2023-01-03', changed: '2023-01-04', icon: 'word-file' },
];

describe('Attachment', () => {
  parityCase(meta, REQUIRED_KEY, Attachment, {
    files: files2,
  });

  parityCase(meta, OPTIONAL_KEY, Attachment, {
    contentTop: 'Top content',
    title: 'Attachment Title',
    content: 'Attachment content',
    files: [
      { name: 'File 1', ext: 'pdf', url: 'https://example.com/file1.pdf', size: '1MB', created: '2023-01-01', changed: '2023-01-02', icon: 'pdf-file' },
    ],
    contentBottom: 'Bottom content',
    theme: 'dark',
    verticalSpacing: 'both',
    withBackground: true,
    'data-test': 'true',
    class: 'custom-class',
  });

  parityCase(meta, EMPTY_KEY, Attachment, {
    files: [],
  });

  parityCase(meta, MULTI_KEY, Attachment, {
    files: [
      ...files2,
      { name: 'File without extension', url: 'https://example.com/file3' },
      { name: 'File with only extension', ext: 'txt', url: 'https://example.com/file4.txt' },
      { name: 'File with only size', url: 'https://example.com/file5', size: '500KB' },
    ],
  });

  expectAllKeysCovered(meta, [REQUIRED_KEY, OPTIONAL_KEY, EMPTY_KEY, MULTI_KEY]);
});
