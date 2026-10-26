import { Directory, Paths } from 'expo-file-system';

// The app is not sandboxed, so Paths.document is the user's ~/Documents.
// App files go in Application Support instead, built synchronously from the
// home folder so module-load reads stay synchronous.
export const dataDirectory = new Directory(
  Paths.document.parentDirectory,
  'Library',
  'Application Support',
  'dev.kadi.github-tracker'
);

if (!dataDirectory.exists) {
  dataDirectory.create({ intermediates: true, idempotent: true });
}
