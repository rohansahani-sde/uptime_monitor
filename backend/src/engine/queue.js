/**
 * Simple priority queue for monitor check scheduling
 * Lower nextRunAt = higher priority
 */
class MonitorQueue {
  constructor() {
    this._queue = [];
  }

  /**
   * Add a monitor job to the queue
   */
  enqueue(job) {
    this._queue.push(job);
    this._queue.sort((a, b) => a.nextRunAt - b.nextRunAt);
  }

  /**
   * Remove and return the next job due to run
   */
  dequeue() {
    return this._queue.shift();
  }

  /**
   * Peek at next job without removing
   */
  peek() {
    return this._queue[0] || null;
  }

  /**
   * Get all jobs due to run now
   */
  getDueJobs() {
    const now = Date.now();
    const due = [];
    while (this._queue.length > 0 && this._queue[0].nextRunAt <= now) {
      due.push(this.dequeue());
    }
    return due;
  }

  /**
   * Remove a job by monitorId
   */
  remove(monitorId) {
    this._queue = this._queue.filter((job) => job.monitorId.toString() !== monitorId.toString());
  }

  /**
   * Update nextRunAt for a monitor
   */
  reschedule(monitorId, nextRunAt) {
    const job = this._queue.find((j) => j.monitorId.toString() === monitorId.toString());
    if (job) {
      job.nextRunAt = nextRunAt;
      this._queue.sort((a, b) => a.nextRunAt - b.nextRunAt);
    }
  }

  /**
   * Check if monitor is already in queue
   */
  has(monitorId) {
    return this._queue.some((j) => j.monitorId.toString() === monitorId.toString());
  }

  get size() {
    return this._queue.length;
  }

  clear() {
    this._queue = [];
  }
}

// Singleton queue instance
const monitorQueue = new MonitorQueue();

module.exports = { monitorQueue, MonitorQueue };
