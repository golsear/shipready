'use client';

import { useRef, useState } from 'react';

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

export default function FetchAbortPage() {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stores the AbortController instance for the currently active request.
  // useRef keeps this value between React renders without causing a new render.
  const controllerRef = useRef<AbortController | null>(null);

  async function loadTodo() {
    // Cancel the previous request if it is still active.
    controllerRef.current?.abort();

    // Every request gets its own AbortController instance.
    const controller = new AbortController();

    // This controller now represents the latest active request.
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // fetch listens to controller.signal.
      // Calling controller.abort() will cancel this request.
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos/1',
        {
          signal: controller.signal,
        },
      );

      // fetch resolves even for HTTP errors such as 404 or 500.
      // Therefore we must check the HTTP status ourselves.
      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status} ${response.statusText}`,
        );
      }

      // Reading and parsing the response body is asynchronous as well.
      const data: Todo = await response.json();

      // Defensive stale-request guard:
      // only the latest active request may update the result state.
      if (controllerRef.current !== controller) {
        return;
      }

      setTodo(data);
    } catch (unknownError) {
      // AbortError means the request was intentionally cancelled.
      // Cancellation is expected control flow, not a real application failure.
      if (
        unknownError instanceof DOMException &&
        unknownError.name === 'AbortError'
      ) {
        return;
      }

      // An old request must not overwrite the error state
      // belonging to a newer request.
      if (controllerRef.current !== controller) {
        return;
      }

      console.error('Request failed:', unknownError);

      setError('Failed to load the todo.');
    } finally {
      // Only the latest request may finish the loading state.
      // An older aborted request must not set loading to false
      // while a newer request is still running.
      if (controllerRef.current === controller) {
        setLoading(false);
      }
    }
  }

  function cancelRequest() {
    // Abort the currently active request.
    controllerRef.current?.abort();
  }

  return (
    <main>
      <h1>Fetch + AbortController Lab</h1>

      <div>
        <button type="button" onClick={loadTodo}>
          Load Todo
        </button>

        <button type="button" onClick={cancelRequest}>
          Cancel Request
        </button>
      </div>

      <p>Status: {loading ? 'Loading...' : 'Idle'}</p>

      {error ? <p role="alert">{error}</p> : null}

      {todo ? (
        <section>
          <h2>Result</h2>

          <p>
            ID: <strong>{todo.id}</strong>
          </p>

          <p>
            Title: <strong>{todo.title}</strong>
          </p>

          <p>
            Completed: <strong>{String(todo.completed)}</strong>
          </p>
        </section>
      ) : null}
    </main>
  );
}