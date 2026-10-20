// =========================================================================
// Practical 10 – EventEmitter Module
// A single shared instance of our custom TaskEvents emitter.
// Using a singleton ensures every module that requires this file gets
// the SAME emitter, so listeners registered in listeners.js are triggered
// by emits inside the controller.
// =========================================================================

const EventEmitter = require('events');

// Extend the built-in EventEmitter (best practice: gives us a named class)
class TaskEvents extends EventEmitter {}

// Export a single shared instance (singleton pattern)
module.exports = new TaskEvents();
