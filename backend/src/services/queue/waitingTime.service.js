/**
 * Rule-Based Waiting Time Calculator
 * NO ML / AI models used.
 * 
 * Formula:
 * effectiveCapacity (KG/hour) = capacityPerHour * activeCounters
 * capacityPerMinute (KG/min) = effectiveCapacity / 60
 * estimatedWaitingMinutes = totalQuantityAhead / capacityPerMinute
 *                          = (totalQuantityAhead / effectiveCapacity) * 60
 */
class WaitingTimeService {
  calculateWaitingMinutes({ totalQuantityAhead, capacityPerHour = 2000, activeCounters = 1 }) {
    const validCapacity = Math.max(100, capacityPerHour);
    const validCounters = Math.max(1, activeCounters);

    const effectiveCapacity = validCapacity * validCounters; // total KG per hour processed
    
    if (totalQuantityAhead <= 0) {
      return 0;
    }

    const estimatedWaitingMinutes = Math.round((totalQuantityAhead / effectiveCapacity) * 60);
    return Math.max(0, estimatedWaitingMinutes);
  }
}

module.exports = new WaitingTimeService();
