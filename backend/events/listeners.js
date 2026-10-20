// =========================================================================
// Practical 10 – Event Listeners
// Register ALL event listeners here. This file is imported once in
// server.js (before routes) so that listeners are ready before any
// event could ever be emitted by the controller.
// =========================================================================

const taskEvents = require('./taskEvents');

// In-memory event log ring buffer for API/UI verification
const eventLogs = [];
const MAX_LOGS = 50;

function recordEventLog(entry) {
  const item = {
    id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    ...entry,
    recordedAt: new Date().toISOString()
  };
  eventLogs.unshift(item);
  if (eventLogs.length > MAX_LOGS) {
    eventLogs.pop();
  }
  return item;
}

// ── Listener 1: task-created ─────────────────────────────────────────────
// This handler runs AFTER the HTTP response has already been sent.
// We simulate a slow notification (2-second delay via setTimeout) to prove
// the API is non-blocking: the response timestamp will always appear in the
// console BEFORE the "Notification sent" timestamp below.
taskEvents.on('task-created', (task) => {
  try {
    // Supplementary Problem 2: Validate data to catch errors
    if (!task || !task.title) {
      throw new Error('Task object or title is missing in task-created event payload');
    }

    const listenerStartTime = new Date().toISOString();

    // Lab step 2 format:
    console.log(`[Notification] Task "${task.title}" created at ${listenerStartTime}`);

    // Pretty console card for student/evaluator clarity
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║               [EVENT] task-created received                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`  ► Task Title        : "${task.title}"`);
    console.log(`  ► Assigned User     : ${task.assignedTo || 'Unassigned'}`);
    console.log(`  ► Status            : ${task.status || 'pending'}`);
    console.log(`  ► API Response Time : ${task.apiResponseTime || 'N/A'}`);
    console.log(`  ► Listener Fired At : ${listenerStartTime}`);
    console.log('  ► Simulating slow background notification (2-second delay)…');

    const logEntry = {
      event: 'task-created',
      taskTitle: task.title,
      assignedTo: task.assignedTo || 'Unassigned',
      apiResponseTime: task.apiResponseTime || null,
      listenerStartTime,
      listenerCompleteTime: null,
      status: 'processing (2s delay)',
      durationMs: null
    };
    const savedLogItem = recordEventLog(logEntry);

    // Supplementary Problem 3: 2-second delay (simulates slow email / push notification / webhook)
    const timerStart = Date.now();
    setTimeout(() => {
      try {
        const listenerCompleteTime = new Date().toISOString();
        const durationMs = Date.now() - timerStart;

        console.log('');
        console.log('┌────────────────────────────────────────────────────────────────┐');
        console.log('│       [Notification] Background processing complete            │');
        console.log('├────────────────────────────────────────────────────────────────┤');
        console.log(`│  Task              : "${task.title}"`);
        console.log(`│  User              : ${task.assignedTo || 'Unassigned'}`);
        console.log(`│  API Responded At  : ${task.apiResponseTime || 'Earlier'}`);
        console.log(`│  Notification Sent : ${listenerCompleteTime}`);
        console.log(`│  Delay Elapsed     : ~${durationMs}ms`);
        console.log('│  (PROVEN: API response was already sent 2 seconds ago!)        │');
        console.log('└────────────────────────────────────────────────────────────────┘');
        console.log('');

        // Update the log entry in-place
        savedLogItem.listenerCompleteTime = listenerCompleteTime;
        savedLogItem.status = 'completed';
        savedLogItem.durationMs = durationMs;
      } catch (err) {
        // Catch any error in async timer callback
        taskEvents.emit('error', err);
      }
    }, 2000); // ← 2-second artificial delay

  } catch (err) {
    // Supplementary Problem 2: Catch error inside task-created handler and emit 'error'
    taskEvents.emit('error', err);
  }
});

// ── Listener 2: task-deleted ─────────────────────────────────────────────
// Supplementary Problem 1: a second event with its own distinct listener.
taskEvents.on('task-deleted', (task) => {
  try {
    const deletedAt = new Date().toISOString();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║               [EVENT] task-deleted received                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`  ► Task Title    : "${task?.title || 'Unknown'}"`);
    console.log(`  ► Task ID       : ${task?._id || 'N/A'}`);
    console.log(`  ► Deleted at    : ${deletedAt}`);
    console.log('  ► Audit log entry recorded & cleanup notification sent.');
    console.log('');

    recordEventLog({
      event: 'task-deleted',
      taskTitle: task?.title || 'Unknown',
      taskId: task?._id,
      assignedTo: task?.assignedTo || 'Unassigned',
      apiResponseTime: task?.apiResponseTime || null,
      listenerStartTime: deletedAt,
      listenerCompleteTime: deletedAt,
      status: 'completed',
      durationMs: 0
    });
  } catch (err) {
    taskEvents.emit('error', err);
  }
});

// ── Listener 3: error ────────────────────────────────────────────────────
// Supplementary Problem 2: error event listener that catches and logs any error.
// 'error' is a special event in Node's EventEmitter — if emitted with
// no listener the process crashes. Always register an error listener!
taskEvents.on('error', (err) => {
  const errorTime = new Date().toISOString();
  console.error('');
  console.error('╔════════════════════════════════════════════════════════════════╗');
  console.error('║         [ERROR] TaskEvents error listener triggered            ║');
  console.error('╚════════════════════════════════════════════════════════════════╝');
  console.error(`  ► Message : ${err.message}`);
  console.error(`  ► Time    : ${errorTime}`);
  console.error('  ► Status  : Error caught and logged safely without crashing process');
  console.error('');

  recordEventLog({
    event: 'error',
    errorMessage: err.message,
    listenerStartTime: errorTime,
    listenerCompleteTime: errorTime,
    status: 'error_caught',
    durationMs: 0
  });
});

console.log('[listeners.js] All task event listeners registered (task-created, task-deleted, error) ✓');

module.exports = {
  getEventLogs: () => [...eventLogs],
  clearEventLogs: () => { eventLogs.length = 0; }
};
