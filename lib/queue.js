// lib/queue.js
class SimpleInMemoryQueue {
    constructor() {
      this.queue = [];
      this.delayedQueue = [];
      this.retryQueue = [];
      this.scheduledJobs = [];
      this.isProcessing = false;
      this.processInterval = 1000; // Time in milliseconds between processing messages
      this.processingFunction = async (message) => {
        // Default processing function (can be overridden by users)
        console.log('Processing message:', message);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing delay
        console.log('Message processed:', message);
      };
  
      this.startProcessing();
    }
  
    // Enqueue a message with optional priority, delay, and batch
    enqueue(message, options = {}) {
      const { priority = 0, delay = 0, retries = 0, scheduledAt = 0, batch = false } = options;
      message.priority = priority;
      message.delay = delay;
      message.retries = retries;
      message.scheduledAt = scheduledAt;
      message.batch = batch;
  
      if (delay > 0) {
        this.delayedQueue.push(message);
      } else if (scheduledAt > Date.now()) {
        this.scheduledJobs.push(message);
      } else {
        this.queue.push(message);
      }
      this.queue.sort((a, b) => b.priority - a.priority); // Prioritize messages
    }
  
    // Process messages automatically
    startProcessing() {
      if (this.isProcessing) return;
  
      this.isProcessing = true;
      (async () => {
        while (this.isProcessing) {
          // Process delayed messages
          this.processDelayedMessages();
  
          // Process scheduled jobs
          this.processScheduledJobs();
  
          // Process regular messages
          if (!this.isEmpty()) {
            const message = this.dequeue();
            if (message) {
              try {
                await this.processingFunction(message);
              } catch (error) {
                console.error('Error processing message:', error);
                this.handleFailedMessage(message, error);
              }
            }
          }
          await new Promise((resolve) => setTimeout(resolve, this.processInterval));
        }
      })();
    }
  
    // Stop processing messages
    stopProcessing() {
      this.isProcessing = false;
    }
  
    // Process delayed messages
    processDelayedMessages() {
      const now = Date.now();
      while (this.delayedQueue.length > 0 && this.delayedQueue[0].delay <= now) {
        const message = this.delayedQueue.shift();
        this.enqueue(message); // Re-enqueue as a regular message
      }
    }
  
    // Process scheduled jobs
    processScheduledJobs() {
      const now = Date.now();
      while (this.scheduledJobs.length > 0 && this.scheduledJobs[0].scheduledAt <= now) {
        const message = this.scheduledJobs.shift();
        this.enqueue(message); // Re-enqueue as a regular message
      }
    }
  
    // Handle failed message processing
    handleFailedMessage(message, error) {
      console.error('Failed message:', message, 'Error:', error);
      if (message.retries > 0) {
        message.retries -= 1;
        this.retryQueue.push(message);
      } else {
        console.log('Message discarded:', message);
      }
    }
  
    // Retry failed messages
    retryFailedMessages() {
      while (this.retryQueue.length > 0) {
        const message = this.retryQueue.shift();
        this.enqueue(message);
      }
    }
  
    // Enqueue messages in a batch
    enqueueBatch(messages, options = {}) {
      messages.forEach(message => this.enqueue(message, options));
    }
  
    // Peek at the next message without removing it
    peek() {
      if (this.queue.length === 0) {
        return null;
      }
      return this.queue[0];
    }
  
    // Get the length of the queue
    getQueueLength() {
      return this.queue.length;
    }
  
    // Check if the queue is empty
    isEmpty() {
      return this.queue.length === 0 && this.delayedQueue.length === 0 && this.scheduledJobs.length === 0;
    }
  
    // Clear the queue
    clearQueue() {
      this.queue = [];
      this.delayedQueue = [];
      this.retryQueue = [];
      this.scheduledJobs = [];
    }
  
    // Set a custom processing function
    setProcessingFunction(processingFunction) {
      this.processingFunction = processingFunction;
    }
  
    // Log the state of the queue
    logQueueState() {
      console.log('Queue:', this.queue);
      console.log('Delayed Queue:', this.delayedQueue);
      console.log('Scheduled Jobs:', this.scheduledJobs);
      console.log('Retry Queue:', this.retryQueue);
    }
  }
  
  module.exports = SimpleInMemoryQueue;
  