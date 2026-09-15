export class RevisionConflictError extends Error {
  readonly expectedRevision: number;

  constructor(expectedRevision: number) {
    super(`Canonical session revision no longer matches expected revision ${expectedRevision}`);
    this.name = 'RevisionConflictError';
    this.expectedRevision = expectedRevision;
  }
}
