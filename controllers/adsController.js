const Advertisement = require('../models/adsModel');
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const { logger } = require('../utils/logger.util');

// Create a new advertisement with image upload
exports.createAdvertisement = async (req, res) => {
  try {
    const { title, websiteLink, position } = req.body;
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Advertisement image is required'
      });
    }

    const advertisement = new Advertisement({
      title,
      websiteLink,
      imagePath: `/uploads/ads/${req.file.filename}`,
      position
    });

    await advertisement.save();
    
    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      advertisement
    });
  } catch (error) {
    // Clean up uploaded file if creation fails
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup advertisement image:', cleanupErr);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating advertisement',
      error: error.message
    });
  }
};

// Get all advertisements
exports.getAllAdvertisements = async (req, res) => {
  try {
    const { position, isActive } = req.query;
    
    const filter = {};
    if (position) filter.position = position;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const advertisements = await Advertisement.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      advertisements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisements',
      error: error.message
    });
  }
};

// Get ads by position (for displaying on website)
exports.getAdsByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    
    const ads = await Advertisement.find({
      position,
      isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ads for position',
      error: error.message
    });
  }
};

// Get advertisement by ID
exports.getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      advertisement: {
        ...advertisement.toObject(),
        ctr: advertisement.ctr
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement',
      error: error.message
    });
  }
};

// Serve advertisement with impression tracking
exports.serveAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement || !advertisement.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found or inactive'
      });
    }

    // Record impression
    await advertisement.recordImpression();

    res.json({
      success: true,
      advertisement: {
        _id: advertisement._id,
        title: advertisement.title,
        websiteLink: advertisement.websiteLink,
        imagePath: advertisement.imagePath,
        position: advertisement.position
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error serving advertisement',
      error: error.message
    });
  }
};

// Track advertisement click
exports.trackClick = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return res.redirect('/'); // Fallback URL
    }

    // Record click
    await advertisement.recordClick();

    // Redirect to advertiser's website
    res.redirect(advertisement.websiteLink || '/');
  } catch (error) {
    // Still redirect even if tracking fails
    res.redirect(advertisement?.websiteLink || '/');
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const { title, websiteLink, position, isActive } = req.body;
    
    const updateData = { title, websiteLink, position, isActive };
    
    // If new image is uploaded, update imagePath
    if (req.file) {
      updateData.imagePath = `/uploads/ads/${req.file.filename}`;
      
      // Find old advertisement to delete old image
      const oldAd = await Advertisement.findById(req.params.id);
      if (oldAd && oldAd.imagePath) {
        const oldImagePath = path.join(__dirname, '..', oldAd.imagePath);
        try {
          await unlinkAsync(oldImagePath);
        } catch (cleanupErr) {
          logger.error('Failed to delete old advertisement image:', cleanupErr);
        }
      }
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!advertisement) {
      // Clean up uploaded file if advertisement not found
      if (req.file) {
        try {
          await unlinkAsync(req.file.path);
        } catch (cleanupErr) {
          logger.error('Failed to cleanup advertisement image:', cleanupErr);
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      advertisement
    });
  } catch (error) {
    // Clean up uploaded file if update fails
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup advertisement image:', cleanupErr);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement',
      error: error.message
    });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Delete associated image file
    if (advertisement.imagePath) {
      const imagePath = path.join(__dirname, '..', advertisement.imagePath);
      try {
        await unlinkAsync(imagePath);
      } catch (cleanupErr) {
        logger.error('Failed to delete advertisement image:', cleanupErr);
      }
    }

    await Advertisement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting advertisement',
      error: error.message
    });
  }
};

// Get advertisement statistics
exports.getAdStats = async (req, res) => {
  try {
    const ads = await Advertisement.find().select('title position stats isActive');
    
    const stats = ads.map(ad => ({
      _id: ad._id,
      title: ad.title,
      position: ad.position,
      isActive: ad.isActive,
      impressions: ad.stats.impressions,
      clicks: ad.stats.clicks,
      ctr: ad.ctr,
      conversions: ad.stats.conversions,
      lastDisplayed: ad.stats.lastDisplayed
    }));

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement statistics',
      error: error.message
    });
  }
};

// Toggle advertisement active status
exports.toggleAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Advertisement ${isActive ? 'activated' : 'deactivated'} successfully`,
      advertisement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement status',
      error: error.message
    });
  }
};

// Get ads for public display (with impression tracking)
exports.getPublicAds = async (req, res) => {
  try {
    const { position } = req.query;
    
    if (!position) {
      return res.status(400).json({
        success: false,
        message: 'Position parameter is required'
      });
    }

    const ads = await Advertisement.find({
      position,
      isActive: true
    }).sort({ createdAt: -1 });

    // Return ads without tracking - tracking happens when ad is served via /serve/:id
    res.status(200).json({
      success: true,
      ads: ads.map(ad => ({
        _id: ad._id,
        title: ad.title,
        websiteLink: ad.websiteLink,
        imagePath: ad.imagePath,
        position: ad.position
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisements',
      error: error.message
    });
  }
};