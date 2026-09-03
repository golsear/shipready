'use client';

import { useRef, useState } from 'react';

type CheckResult = {
  url: string;
  reachable: boolean;
  delay: number;
};

type FakeRequestOptions = {
  signal?: AbortSignal;
};

async function fakeRequest(
  url: string,
  options: FakeRequestOptions = {},
): Promise<CheckResult> {
  const delay = Math.floor(Math.random() * 3000) + 500;

  // This Promise simulates an asynchronous network request.
  // It stays pending until resolve() is called by the timer.
  await new Promise<void>((resolve, reject) => {
    // setTimeout schedules the callback for a future task.
    // JavaScript is NOT blocked while we are waiting.
    const timeoutId = window.setTimeout(() => {
      // The simulated request has completed successfully.
      resolve();
    }, delay);

    // If there is no AbortSignal, the request cannot be cancelled.
    if (!options.signal) {
      return;
    }

    // If the request was already aborted before this code ran,
    // stop the timer and reject the Promise immediately.
    if (options.signal.aborted) {
      window.clearTimeout(timeoutId);

      reject(
        new DOMException('The request was aborted.', 'AbortError'),
      );

      return;
    }

    // Listen for a future abort() call.
    options.signal.addEventListener(
      'abort',
      () => {
        // The timer is no longer needed because this request is obsolete.
        window.clearTimeout(timeoutId);

        // Rejecting with AbortError lets the caller distinguish
        // cancellation from a real failure.
        reject(
          new DOMException('The request was aborted.', 'AbortError'),
        );
      },
      { once: true },
    );
  });

  // This code runs only after the Promise above has been fulfilled.
  // Because fakeRequest is async, this value fulfills the
  // Promise<CheckResult> returned by fakeRequest().
  return {
    url,
    reachable: true,
    delay,
  };
}

export default function AsyncRacePage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stores the controller for the currently active request.
  // Starting a new request allows us to abort the previous one.
  const controllerRef = useRef<AbortController | null>(null);

  // Each request receives its own monotonically increasing ID.
  // Only the latest request is allowed to update state.
  const latestRequestIdRef = useRef(0);

  async function handleCheck() {
    const currentUrl = url.trim();

    if (!currentUrl) {
      return;
    }

    // The previous request is obsolete as soon as a newer check starts.
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    // Capture an ID that belongs only to this invocation.
    const requestId = ++latestRequestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await fakeRequest(currentUrl, {
        signal: controller.signal,
      });

      // Even though we abort previous requests, this extra guard
      // guarantees that a stale async operation cannot update the UI.
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setResult(response);
    } catch (unknownError) {
      // Cancellation is expected control flow, not an application failure.
      if (
        unknownError instanceof DOMException &&
        unknownError.name === 'AbortError'
      ) {
        return;
      }

      // A real error should be visible to the user.
      setError('The deployment check failed.');
    } finally {
      // An older request must not turn loading off
      // while the newest request is still running.
      if (requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <main>
      <h1>Async Race Lab</h1>

      <label>
        Deployment URL
        <input
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
          }}
          placeholder="https://example.com"
        />
      </label>

      <button
        type="button"
        onClick={handleCheck}
        disabled={loading && !url.trim()}
      >
        Check
      </button>

      <p>{loading ? 'Checking...' : 'Idle'}</p>

      {error ? (
        <p role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section>
          <h2>Latest rendered result</h2>

          <p>
            URL: <strong>{result.url}</strong>
          </p>

          <p>
            Reachable: <strong>{String(result.reachable)}</strong>
          </p>

          <p>
            Request delay: <strong>{result.delay} ms</strong>
          </p>
        </section>
      ) : null}
    </main>
  );
}