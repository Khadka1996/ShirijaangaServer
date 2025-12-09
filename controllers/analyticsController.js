const AnalyticsConfig = require('../models/AnalyticsConfig');
const { GA4Service } = require('../utils/ga4Service');

const getAnalyticsConfigs = async (req, res) => {
  try {
    const configs = await AnalyticsConfig.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: configs.length,
      data: configs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAnalyticsConfig = async (req, res) => {
  try {
    const config = await AnalyticsConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const createAnalyticsConfig = async (req, res) => {
  try {
    const {
      displayName,
      project_id,
      private_key_id,
      private_key,
      client_email,
      client_id,
      auth_uri,
      token_uri,
      ga4_property_id
    } = req.body;
    
    const requiredFields = [
      'displayName', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id', 'ga4_property_id'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    if (!ga4_property_id.match(/^G-[A-Z0-9]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GA4 Property ID format'
      });
    }
    
    const config = new AnalyticsConfig({
      displayName,
      project_id,
      private_key_id,
      private_key,
      client_email,
      client_id,
      auth_uri: auth_uri || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: token_uri || 'https://oauth2.googleapis.com/token',
      ga4_property_id,
      createdBy: req.user.id
    });
    
    await config.save();
    
    res.status(201).json({
      success: true,
      message: 'GA4 configuration created successfully',
      data: config
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateAnalyticsConfig = async (req, res) => {
  try {
    const config = await AnalyticsConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    Object.keys(req.body).forEach(key => {
      if (config[key] !== undefined && key !== '_id') {
        config[key] = req.body[key];
      }
    });
    
    await config.save();
    
    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteAnalyticsConfig = async (req, res) => {
  try {
    const config = await AnalyticsConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    if (config.isActive) {
      const activeConfigs = await AnalyticsConfig.countDocuments({ isActive: true });
      if (activeConfigs === 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the only active configuration'
        });
      }
    }
    
    await AnalyticsConfig.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const testAnalyticsConfig = async (req, res) => {
  try {
    const result = await GA4Service.testConfiguration(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Configuration test completed',
      ...result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const activateAnalyticsConfig = async (req, res) => {
  try {
    const config = await AnalyticsConfig.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    
    if (!config.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot activate unverified configuration'
      });
    }
    
    await AnalyticsConfig.updateMany(
      { _id: { $ne: req.params.id } },
      { isActive: false }
    );
    
    config.isActive = true;
    await config.save();
    
    res.status(200).json({
      success: true,
      message: 'Configuration activated successfully',
      data: config
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAnalyticsData = async (req, res) => {
  try {
    const { metric, days } = req.query;
    
    const data = await GA4Service.getReport(metric || 'overview', days || '7');
    
    res.status(200).json({
      success: true,
      data: data,
      metric: metric || 'overview',
      dateRange: `${days || 7} days`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAnalyticsStatus = async (req, res) => {
  try {
    const activeConfig = await AnalyticsConfig.getActiveConfig();
    const totalConfigs = await AnalyticsConfig.countDocuments();
    const verifiedConfigs = await AnalyticsConfig.countDocuments({ isVerified: true });
    
    let status = 'not_configured';
    let message = 'No GA4 configuration found';
    
    if (activeConfig) {
      status = 'active';
      message = `Using: ${activeConfig.displayName}`;
    } else if (verifiedConfigs > 0) {
      status = 'inactive';
      message = 'Verified configuration exists but not activated';
    }
    
    res.status(200).json({
      success: true,
      data: {
        status,
        message,
        totalConfigs,
        verifiedConfigs,
        activeConfig: activeConfig ? {
          id: activeConfig._id,
          displayName: activeConfig.displayName,
          ga4_property_id: activeConfig.ga4_property_id,
          lastTested: activeConfig.lastTested
        } : null
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAnalyticsConfigs,
  getAnalyticsConfig,
  createAnalyticsConfig,
  updateAnalyticsConfig,
  deleteAnalyticsConfig,
  testAnalyticsConfig,
  activateAnalyticsConfig,
  getAnalyticsData,
  getAnalyticsStatus
};