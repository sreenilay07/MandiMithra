const env = require('../../config/env');
const MockMapsProvider = require('./providers/mock.provider');
const GoogleMapsProvider = require('./providers/google.provider');

class MapsService {
  constructor() {
    if (env.MAP_PROVIDER === 'google' && env.GOOGLE_MAPS_API_KEY) {
      this.provider = new GoogleMapsProvider(env.GOOGLE_MAPS_API_KEY);
    } else {
      this.provider = new MockMapsProvider();
    }
  }

  async calculateTravelTime(origin, destination) {
    return await this.provider.getTravelTime(origin, destination);
  }
}

module.exports = new MapsService();
