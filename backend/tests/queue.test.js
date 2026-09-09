const waitingTimeService = require('../src/services/queue/waitingTime.service');
const departureService = require('../src/services/queue/departure.service');

describe('QUEUE ENGINE - Rule-Based Calculation Tests', () => {
  it('should calculate 75 minutes wait for 5000kg workload ahead with 2 active counters @ 2000kg/hr', () => {
    const minutes = waitingTimeService.calculateWaitingMinutes({
      totalQuantityAhead: 5000,
      capacityPerHour: 2000,
      activeCounters: 2
    });

    // 5000 / (2000 * 2) * 60 = 75 minutes
    expect(minutes).toBe(75);
  });

  it('should scale down waiting time to 38 minutes when opening a 3rd counter', () => {
    const minutes = waitingTimeService.calculateWaitingMinutes({
      totalQuantityAhead: 5000,
      capacityPerHour: 2000,
      activeCounters: 3
    });

    // 5000 / 6000 * 60 = 50 minutes
    expect(minutes).toBe(50);
  });

  it('should calculate smart departure recommendation time correctly', () => {
    const departure = departureService.calculateSmartDeparture({
      estimatedWaitingMinutes: 75,
      travelTimeMinutes: 30,
      safetyBufferMinutes: 10
    });

    expect(departure).toHaveProperty('recommendedDepartureTime');
    expect(departure.estimatedWaitingMinutes).toBe(75);
  });
});
