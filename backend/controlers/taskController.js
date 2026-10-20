// =========================================================================
// Task Controller
// Practical 9  – In-Memory Caching (node-cache)
// Practical 10 – Async EventEmitter background notifications
// =========================================================================

const Task = require('../models/Task');

// Practical 9: shared cache instance (60-second TTL)
const cache = require('../cache/taskCache');

// Practical 10: shared EventEmitter singleton
const taskEvents = require('../events/taskEvents');

// Cache keys – using constants avoids typo bugs
const CACHE_KEY_ALL   = 'all_tasks';
const CACHE_KEY_ONE   = (id) => `task_${id}`;

// ── Helper: invalidate every task-related cache entry ────────────────────
// Called after any write (POST / PUT / DELETE) so stale data is never served.
const invalidateCache = (taskId) => {
  cache.del(CACHE_KEY_ALL);
  if (taskId) cache.del(CACHE_KEY_ONE(taskId));
  console.log('[Cache] Invalidated → all_tasks' + (taskId ? ` + task_${taskId}` : ''));
};

// ── 1. GET /tasks – Fetch all tasks ──────────────────────────────────────
// Practical 9: check cache first; only hit MongoDB on a miss.
const getAllTasks = async (req, res, next) => {
  try {
    // Cache check (with hit/miss logging)
    const cached = cache.getWithStats(CACHE_KEY_ALL);
    if (cached) {
      return res.status(200).json(cached); // Cache HIT – instant response
    }

    // Cache MISS – query MongoDB, then store result
    const tasks = await Task.find();
    cache.set(CACHE_KEY_ALL, tasks);
    console.log(`[Cache] SET  → key: "${CACHE_KEY_ALL}" | ${tasks.length} tasks stored`);

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// ── 2. GET /tasks/:id – Fetch single task ────────────────────────────────
// Supplementary Problem: cache individual tasks separately.
const getTaskById = async (req, res, next) => {
  try {
    const key = CACHE_KEY_ONE(req.params.id);

    // Cache check
    const cached = cache.getWithStats(key);
    if (cached) {
      return res.status(200).json(cached); // Cache HIT
    }

    // Cache MISS
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    cache.set(key, task);
    console.log(`[Cache] SET  → key: "${key}"`);

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

// ── 3. POST /tasks – Create a new task ───────────────────────────────────
// Practical 9:  invalidate cache after write.
// Practical 10: emit 'task-created' AFTER responding so the API is non-blocking.
const createTask = async (req, res, next) => {
  try {
    const task = await Task.create(req.body);

    // Practical 9: invalidate so next GET /tasks fetches fresh data
    invalidateCache();

    // Practical 10 ①: Log + send the HTTP response FIRST
    const apiResponseTime = new Date().toISOString();
    console.log(`\n[API] Response sent at ${apiResponseTime}`);
    res.status(201).json(task);

    // Practical 10 ②: Emit AFTER response — listener runs asynchronously
    //                  and CANNOT delay the HTTP reply.
    taskEvents.emit('task-created', {
      _id: task._id,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo || req.body.assignedTo || 'Unassigned',
      status: task.completed ? 'completed' : 'pending',
      priority: task.priority,
      apiResponseTime
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstField = Object.keys(error.errors)[0];
      const message = error.errors[firstField]
        ? error.errors[firstField].message
        : 'Validation failed';
      return res.status(400).json({ error: 'Validation failed', message });
    }
    next(error);
  }
};

// ── 4. PUT /tasks/:id – Update a task ────────────────────────────────────
// Practical 9: invalidate cache for both the all-tasks list and this specific task.
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Practical 9: invalidate after write
    invalidateCache(req.params.id);

    res.status(200).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstField = Object.keys(error.errors)[0];
      const message = error.errors[firstField]
        ? error.errors[firstField].message
        : 'Validation failed';
      return res.status(400).json({ error: 'Validation failed', message });
    }
    next(error);
  }
};

// ── 5. DELETE /tasks/:id – Delete a task ─────────────────────────────────
// Practical 9:  invalidate cache after write.
// Practical 10: emit 'task-deleted' AFTER responding (Supplementary Problem).
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Practical 9: invalidate cache
    invalidateCache(req.params.id);

    // Practical 10 ①: Send response first
    const apiResponseTime = new Date().toISOString();
    console.log(`\n[API] Delete response sent at ${apiResponseTime}`);
    res.status(200).json({ message: 'Task deleted successfully', task });

    // Practical 10 ②: Emit after response
    taskEvents.emit('task-deleted', {
      _id: task._id,
      title: task.title,
      assignedTo: task.assignedTo || 'Unassigned',
      apiResponseTime
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
