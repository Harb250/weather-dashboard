// api.js — one place that talks to the network.
// Every request goes through getJSON(), so every failure ends up as an ApiError
// with a `kind` the UI can turn into a friendly message.

const { ApiError, getJSON } = (() => {
  class ApiError extends Error {
    /**
     * @param {'network'|'timeout'|'not-found'|'auth'|'rate-limit'|'server'|'http'|'bad-data'} kind
     * @param {string} message
     * @param {number} [status] HTTP status code, when a response did arrive
     */
    constructor(kind, message, status) {
      super(message);
      this.name = 'ApiError';
      this.kind = kind;
      this.status = status;
    }
  }

  const TIMEOUT_MS = 10_000;

  // Map an HTTP status code to the kind of problem it means for the user.
  function kindForStatus(status) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 404) return 'not-found';
    if (status === 429) return 'rate-limit';
    if (status >= 500) return 'server';
    return 'http';
  }

  async function getJSON(url) {
    let response;

    // 1) fetch() itself rejects only when no response arrives at all
    //    (offline, DNS, CORS) — or when our timeout aborts it.
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new ApiError('timeout', `Request timed out after ${TIMEOUT_MS / 1000}s`);
      }
      throw new ApiError('network', 'Network request failed');
    }

    // 2) A 404 or 500 is NOT an error to fetch — check response.ok ourselves.
    if (!response.ok) {
      throw new ApiError(kindForStatus(response.status), `HTTP ${response.status}`, response.status);
    }

    // 3) The body can still be broken.
    try {
      return await response.json();
    } catch {
      throw new ApiError('bad-data', 'Response was not valid JSON', response.status);
    }
  }

  return { ApiError, getJSON };
})();
