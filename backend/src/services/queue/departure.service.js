const env = require('../../config/env');

class DepartureService {
  calculateSmartDeparture({ estimatedWaitingMinutes, travelTimeMinutes = 30, safetyBufferMinutes = env.QUEUE_SAFETY_BUFFER_MINUTES }) {
    const now = new Date();
    
    // Calculate estimated turn time
    const estimatedTurnTime = new Date(now.getTime() + estimatedWaitingMinutes * 60 * 1000);

    // Subtract travel time and safety buffer to find recommended departure time
    const totalLeadMinutes = travelTimeMinutes + safetyBufferMinutes;
    const recommendedDepartureTime = new Date(estimatedTurnTime.getTime() - totalLeadMinutes * 60 * 1000);

    const isLeaveImmediately = recommendedDepartureTime <= now;

    return {
      now,
      estimatedWaitingMinutes,
      travelTimeMinutes,
      safetyBufferMinutes,
      estimatedTurnTime,
      recommendedDepartureTime,
      isLeaveImmediately,
      departureRecommendationText: isLeaveImmediately
        ? 'Leave as soon as possible'
        : `Recommended departure at ${recommendedDepartureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };
  }
}

module.exports = new DepartureService();
