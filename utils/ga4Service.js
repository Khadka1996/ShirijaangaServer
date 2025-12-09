const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const AnalyticsConfig = require('../models/AnalyticsConfig');

class GA4Service {
  static async getClient() {
    const config = await AnalyticsConfig.getActiveConfig();
    
    if (!config) {
      throw new Error('No active GA4 configuration found');
    }
    
    if (!config.isVerified) {
      throw new Error('GA4 configuration is not verified');
    }
    
    const credentials = config.getDecryptedCredentials();
    
    return new BetaAnalyticsDataClient({
      credentials: credentials,
    });
  }
  
  static async testConfiguration(configId) {
    const config = await AnalyticsConfig.findById(configId);
    if (!config) {
      throw new Error('Configuration not found');
    }
    
    return await config.testConfiguration();
  }
  
  static async getReport(metric, days = '7') {
    const client = await this.getClient();
    const config = await AnalyticsConfig.getActiveConfig();
    
    const dateRanges = [{
      startDate: `${days}daysAgo`,
      endDate: 'today'
    }];
    
    let requestConfig = {};
    
    switch (metric) {
      case 'overview':
        requestConfig = {
          dateRanges,
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'newUsers' },
          ],
          dimensions: [{ name: 'date' }],
        };
        break;
        
      case 'traffic-sources':
        requestConfig = {
          dateRanges,
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'engagedSessions' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        };
        break;
        
      case 'popular-pages':
        requestConfig = {
          dateRanges,
          dimensions: [
            { name: 'pageTitle' },
            { name: 'pagePath' }
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 15,
        };
        break;
        
      case 'user-demographics':
        requestConfig = {
          dateRanges,
          dimensions: [
            { name: 'country' },
            { name: 'city' }
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 20,
        };
        break;
        
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
    
    const [response] = await client.runReport({
      property: `properties/${config.ga4_property_id}`,
      ...requestConfig
    });
    
    return response;
  }
}

module.exports = { GA4Service };