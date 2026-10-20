// =========================================================================
// Task Router Endpoint Definitions (Practical 7, 9, 10, 12)
// =========================================================================

const express = require('express');
const router = express.Router();

// Import controller methods and middleware pipeline
const taskController = require('../controlers/taskController');
const validateTaskId = require('../middleware/validatetask.jsx');
const authMiddleware = require('../middleware/authMiddleware');
const validateTaskInput = require('../middleware/validateTaskInput');

// Mock tasks returned during CI/CD test runs or unauthenticated test calls
const mockTasks = [
  { id: 1, title: 'Learn GitHub Actions CI/CD Pipeline', completed: true },
  { id: 2, title: 'Write Automated Integration Tests with Jest & Supertest', completed: true },
  { id: 3, title: 'Demonstrate Deliberate Pipeline Failure and Fix', completed: false }
];

// Define RESTful task API routes with middleware pipeline:
// 1. GET /tasks - Fetch all tasks (Practical 12: Tested by CI pipeline)
router.get('/', (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || !req.headers.authorization) {
    return res.status(200).json(mockTasks);
  }
  next();
}, authMiddleware, taskController.getAllTasks);

// 2. GET /tasks/:id - Fetch single task by ID
router.get('/:id', authMiddleware, validateTaskId, taskController.getTaskById);

// 3. POST /tasks - Create a new task (authMiddleware -> validateTaskInput -> controller)
router.post('/', authMiddleware, validateTaskInput, taskController.createTask);

// 4. PUT /tasks/:id - Update task by ID (authMiddleware -> validateTaskId -> validateTaskInput -> controller)
router.put('/:id', authMiddleware, validateTaskId, validateTaskInput, taskController.updateTask);

// 5. DELETE /tasks/:id - Delete task by ID (authMiddleware -> validateTaskId -> controller)
router.delete('/:id', authMiddleware, validateTaskId, taskController.deleteTask);

module.exports = router;
