// Retry only a session read after a transient database connection failure.
// Invalid sessions remain null; authentication and schema errors are never retried.
export async function readSessionWithRetry<T>(
  read: () => Promise<T>,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isConnectionFailure(error)) throw error;
    return read();
  }
}

function isConnectionFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { code?: string }).code;
  return (
    [
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "57P01",
      "57P02",
      "57P03",
      "08006",
    ].includes(code ?? "") ||
    [
      "Connection terminated due to connection timeout",
      "Connection terminated unexpectedly",
      "timeout exceeded when trying to connect",
    ].includes(error.message)
  );
}
