const mongoose = require('mongoose');
const crypto = require('crypto');

const analyticsConfigSchema = new mongoose.Schema({
  // Basic Information
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  
  // Google Service Account Details
  project_id: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true
  },
  private_key_id: {
    type: String,
    required: [true, 'Private key ID is required']
  },
  private_key: {
    type: String,
    required: [true, 'Private key is required']
  },
  client_email: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true
  },
  client_id: {
    type: String,
    required: [true, 'Client ID is required'],
    trim: true
  },
  auth_uri: {
    type: String,
    default: 'https://accounts.google.com/o/oauth2/auth'
  },
  token_uri: {
    type: String,
    default: 'https://oauth2.googleapis.com/token'
  },
  
  // GA4 Property Details
  ga4_property_id: {
    type: String,
    required: [true, 'GA4 Property ID is required'],
    trim: true,
    match: [/^G-[A-Z0-9]+$/, 'Invalid GA4 Property ID format']
  },
  
  // Configuration Status
  isActive: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastTested: {
    type: Date,
    default: null
  },
  testStatus: {
    type: String,
    enum: ['not_tested', 'success', 'failed'],
    default: 'not_tested'
  },
  testErrorMessage: {
    type: String,
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.private_key;
      delete ret.private_key_id;
      delete ret.client_email;
      return ret;
    }
  }
});

// Encryption methods
analyticsConfigSchema.methods.encryptField = function(text) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from(this._id.toString()));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
};

analyticsConfigSchema.methods.decryptField = function(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    
    decipher.setAAD(Buffer.from(this._id.toString()));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

// Pre-save middleware for encryption
analyticsConfigSchema.pre('save', function(next) {
  if (this.isModified('private_key') || this.isNew) {
    this.private_key = this.encryptField(this.private_key);
  }
  if (this.isModified('client_email') || this.isNew) {
    this.client_email = this.encryptField(this.client_email);
  }
  if (this.isModified('private_key_id') || this.isNew) {
    this.private_key_id = this.encryptField(this.private_key_id);
  }
  next();
});

// Get decrypted credentials for API use
analyticsConfigSchema.methods.getDecryptedCredentials = function() {
  return {
    type: 'service_account',
    project_id: this.project_id,
    private_key_id: this.decryptField(this.private_key_id),
    private_key: this.decryptField(this.private_key),
    client_email: this.decryptField(this.client_email),
    client_id: this.client_id,
    auth_uri: this.auth_uri,
    token_uri: this.token_uri
  };
};

// Static method to get active configuration
analyticsConfigSchema.statics.getActiveConfig = function() {
  return this.findOne({ isActive: true, isVerified: true });
};

// Instance method to test configuration
analyticsConfigSchema.methods.testConfiguration = async function() {
  const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  
  try {
    const credentials = this.getDecryptedCredentials();
    
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: credentials,
    });

    // Test connection
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${this.ga4_property_id}`,
      dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 1,
    });

    // Update status
    this.isVerified = true;
    this.testStatus = 'success';
    this.lastTested = new Date();
    this.testErrorMessage = null;
    await this.save();

    return {
      success: true,
      message: 'Configuration test successful',
      data: response
    };
  } catch (error) {
    this.isVerified = false;
    this.testStatus = 'failed';
    this.lastTested = new Date();
    this.testErrorMessage = error.message;
    await this.save();

    throw new Error(`Configuration test failed: ${error.message}`);
  }
};

module.exports = mongoose.model('AnalyticsConfig', analyticsConfigSchema);