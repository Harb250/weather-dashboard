const { ApiError, getJSON } = (() => {
  class ApiError extends Error {
    constructor(kind, message, status) {
      super(message);
      this.name = 'ApiError';
      this.kind = kind;
      this.status = status;
    }
  }

  const TIMEOUT_MS = 10_000;

  function kindForStatus(status) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 404) return 'not-found';
    if (status === 429) return 'rate-limit';
    if (status >= 500) return 'server';
    return 'http';
  }

  async function getJSON(url) {
    let response;

    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new ApiError('timeout', `Request timed out after ${TIMEOUT_MS / 1000}s`);
      }
      throw new ApiError('network', 'Network request failed');
    }

    if (!response.ok) {
      throw new ApiError(kindForStatus(response.status), `HTTP ${response.status}`, response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new ApiError('bad-data', 'Response was not valid JSON', response.status);
    }
  }

  return { ApiError, getJSON };
})();
