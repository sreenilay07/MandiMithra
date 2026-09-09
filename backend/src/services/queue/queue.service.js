const Token = require('../../models/Token');
const ProcurementCentre = require('../../models/ProcurementCentre');
const CentreCapacity = require('../../models/CentreCapacity');
const Counter = require('../../models/Counter');
const waitingTimeService = require('./waitingTime.service');
const departureService = require('./departure.service');
const logger = require('../../utils/logger');
const { TOKEN_STATUS, COUNTER_STATUS } = require('../../constants/status');

class QueueService {
  async getCentreEffectiveCapacity(centreId, cropId = null) {
    const centre = await ProcurementCentre.findById(centreId);
    if (!centre) {
      return { capacityPerHour: 2000, activeCounters: 1 };
    }

    // Count open counters for centre
    const openCountersCount = await Counter.countDocuments({
      centreId,
      status: COUNTER_STATUS.OPEN
    });

    const activeCounters = openCountersCount > 0 ? openCountersCount : Math.max(1, centre.activeCounters || 1);

    let capacityPerHour = centre.defaultCapacity || 2000;

    if (cropId) {
      const override = await CentreCapacity.findOne({
        centreId,
        cropId,
        status: 'ACTIVE'
      });
      if (override && override.capacityPerHour) {
        capacityPerHour = override.capacityPerHour;
      }
    }

    return {
      capacityPerHour,
      activeCounters,
      effectiveCapacity: capacityPerHour * activeCounters
    };
  }

  async recalculateQueue(centreId) {
    try {
      // 1. Fetch active capacity metrics for centre
      const { capacityPerHour, activeCounters } = await this.getCentreEffectiveCapacity(centreId);

      // 2. Fetch all active waiting tokens for today/active session
      const activeTokens = await Token.find({
        centreId,
        status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.CALLED, TOKEN_STATUS.ARRIVED, TOKEN_STATUS.IN_PROGRESS] }
      }).sort({ queuePosition: 1, createdAt: 1 });

      let runningQuantityAhead = 0;
      let currentPosition = 1;

      const updatePromises = activeTokens.map(async (token) => {
        // Position 1 or already processing tokens have 0 quantity ahead
        const isCurrentProcessing = [TOKEN_STATUS.CALLED, TOKEN_STATUS.ARRIVED, TOKEN_STATUS.IN_PROGRESS].includes(token.status);
        const quantityAheadForThisToken = isCurrentProcessing ? 0 : runningQuantityAhead;

        const waitingMinutes = waitingTimeService.calculateWaitingMinutes({
          totalQuantityAhead: quantityAheadForThisToken,
          capacityPerHour,
          activeCounters
        });

        const departureInfo = departureService.calculateSmartDeparture({
          estimatedWaitingMinutes: waitingMinutes,
          travelTimeMinutes: token.travelTimeMinutes || 30
        });

        token.queuePosition = currentPosition;
        token.estimatedWaitingMinutes = waitingMinutes;
        token.estimatedTurnTime = departureInfo.estimatedTurnTime;
        token.recommendedDepartureTime = departureInfo.recommendedDepartureTime;

        // If not currently processing, add expected quantity to total workload ahead for subsequent farmers
        if (token.status === TOKEN_STATUS.WAITING) {
          runningQuantityAhead += (token.expectedQuantity || 0);
        }

        currentPosition += 1;
        return token.save();
      });

      await Promise.all(updatePromises);

      logger.info(`[QUEUE ENGINE] Recalculated queue for Centre ${centreId}: ${activeTokens.length} active tokens processed.`);

      // Emit Socket.IO event
      const socketHandler = require('../../socket/socket.handler');
      if (socketHandler && socketHandler.emitQueueUpdate) {
        socketHandler.emitQueueUpdate(centreId, {
          centreId,
          activeTokensCount: activeTokens.length,
          activeCounters,
          capacityPerHour,
          updatedAt: new Date()
        });
      }

      return {
        centreId,
        activeTokensCount: activeTokens.length,
        activeCounters,
        capacityPerHour
      };
    } catch (error) {
      logger.error(`[QUEUE ENGINE ERROR] Centre ${centreId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new QueueService();
