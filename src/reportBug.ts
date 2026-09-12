const REPO = 'kueda/underfoot-web';

// Builds a URL that opens a new GitHub issue pre-filled with the current map
// view. The URL hash already encodes the pack, map type, and location (see
// urlHash.ts), so window.location.href alone is enough to reproduce it.
export function buildBugReportUrl(): string {
  const params = new URLSearchParams({
    labels: 'bug',
    body: [
      '## What went wrong?',
      '',
      '<!-- what were you doing, and what did you expect to happen instead? -->',
      '',
      '## Map link',
      '',
      window.location.href,
    ].join('\n'),
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

// Opens a pre-filled GitHub issue in a new tab so the reporter can describe
// the bug.
export function reportBug(): void {
  window.open(buildBugReportUrl(), '_blank', 'noopener,noreferrer');
}
