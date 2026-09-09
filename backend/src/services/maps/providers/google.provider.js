const logger = require('../../../utils/logger');

class GoogleMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getTravelTime(origin, destination) {
    if (!this.apiKey) {
      logger.warn('[GOOGLE MAPS PROVIDER] API Key missing, falling back to 30 min estimate');
      return {
        distanceKm: 15,
        travelTimeMinutes: 30,
        routeSummary: 'Default Route (Missing API Key)',
        provider: 'google-fallback'
      };
    }
    // Abstract interface for Google Distance Matrix API call
    return {
      distanceKm: 18,
      travelTimeMinutes: 35,
      routeSummary: 'Main State Highway via Google Maps',
      provider: 'google'
    };
  }
}

module.exports = GoogleMapsProvider;
