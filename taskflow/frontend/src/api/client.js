const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new ApiError('Could not reach the server. Check that the backend is running.', 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getBoard: (boardId) => request(`/boards/${boardId}`),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, updates) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  moveTask: (id, columnId) =>
    request(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ columnId }) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

export { ApiError };
