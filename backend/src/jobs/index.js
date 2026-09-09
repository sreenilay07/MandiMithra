const queueService = require('../services/queue/queue.service');
const logger = require('../utils/logger');

class JobScheduler {
  initJobs() {
    logger.info('[JOBS] Initializing background jobs scheduler...');
    // Periodic queue recalculation placeholder/heartbeat every 15 mins if active
  }

  async triggerQueueRecalculation(centreId) {
    if (centreId) {
      return await queueService.recalculateQueue(centreId);
    }
  }
}

module.exports = new JobScheduler();
