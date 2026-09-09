class MockMapsProvider {
  async getTravelTime(origin, destination) {
    // Standard mock calculation based on coordinates or fixed estimate
    const latDiff = Math.abs((origin.latitude || 17.38) - (destination.latitude || 17.40));
    const lngDiff = Math.abs((origin.longitude || 78.48) - (destination.longitude || 78.50));
    const estimatedDistanceKm = Math.round((latDiff + lngDiff) * 111 * 10) / 10 || 15;
    
    // Assume average speed 30 km/h in rural/semi-urban routes
    const travelTimeMinutes = Math.max(10, Math.round((estimatedDistanceKm / 30) * 60)) || 30;

    return {
      distanceKm: estimatedDistanceKm,
      travelTimeMinutes: travelTimeMinutes,
      routeSummary: 'NH 44 via Rural Procurement Access Route (Simulated)',
      provider: 'mock'
    };
  }
}

module.exports = MockMapsProvider;
