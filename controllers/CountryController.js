const Country = require('../models/CountryModel');
const { logger } = require('../utils/logger.util');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');

const createCountry = async (req, res) => {
  try {
    const { name, title, info, isActive } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const existingCountry = await Country.findOne({ 
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { slug: slug }
      ]
    });

    if (existingCountry) {
      if (req.file) {
        await unlinkAsync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Country with this name already exists'
      });
    }

    const country = new Country({
      name,
      slug, // Explicitly set the slug
      title: title || `Study at ${name}`,
      info,
      isActive: isActive !== undefined ? isActive : true,
      photo: req.file ? `/uploads/countries/${req.file.filename}` : null
    });

    await country.save();

    logger.info(`Country created by ${req.user.role}: ${country.name}`);

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country
    });

  } catch (error) {
    logger.error('Create country error:', error);
    
    if (req.file) {
      await unlinkAsync(req.file.path).catch(cleanupErr => 
        logger.error('Cleanup error:', cleanupErr)
      );
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create country',
      error: error.message
    });
  }
};

const getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });

    res.json({
      success: true,
      count: countries.length,
      data: countries
    });

  } catch (error) {
    logger.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
};

const getCountryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const country = await Country.findOne({ slug });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      data: country
    });

  } catch (error) {
    logger.error('Get country by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country',
      error: error.message
    });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, info, isActive } = req.body;

    const country = await Country.findById(id);

    if (!country) {
      if (req.file) {
        await unlinkAsync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    if (name && name !== country.name) {
      const existingCountry = await Country.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingCountry) {
        if (req.file) {
          await unlinkAsync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Country with this name already exists'
        });
      }
    }

    if (name) country.name = name;
    if (title) country.title = title;
    if (info) country.info = info;
    if (isActive !== undefined) country.isActive = isActive;

    if (req.file) {
      if (country.photo) {
        const oldPhotoPath = path.join(__dirname, '..', country.photo);
        await unlinkAsync(oldPhotoPath).catch(err => 
          logger.error('Old photo delete error:', err)
        );
      }
      country.photo = `/uploads/countries/${req.file.filename}`;
    }

    await country.save();

    logger.info(`Country updated by ${req.user.role}: ${country.name}`);

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });

  } catch (error) {
    logger.error('Update country error:', error);
    
    if (req.file) {
      await unlinkAsync(req.file.path).catch(cleanupErr => 
        logger.error('Cleanup error:', cleanupErr)
      );
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update country',
      error: error.message
    });
  }
};

const toggleCountryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const country = await Country.findById(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    country.isActive = isActive;
    await country.save();

    logger.info(`Country status updated by ${req.user.role}: ${country.name} - ${isActive ? 'Active' : 'Inactive'}`);

    res.json({
      success: true,
      message: `Country ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: country
    });

  } catch (error) {
    logger.error('Toggle country status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update country status',
      error: error.message
    });
  }
};

const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findById(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    if (country.photo) {
      const photoPath = path.join(__dirname, '..', country.photo);
      await unlinkAsync(photoPath).catch(err => 
        logger.error('Photo delete error:', err)
      );
    }

    await Country.findByIdAndDelete(id);

    logger.info(`Country deleted by ${req.user.role}: ${country.name}`);

    res.json({
      success: true,
      message: 'Country deleted successfully'
    });

  } catch (error) {
    logger.error('Delete country error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete country',
      error: error.message
    });
  }
};const getCountryById = async (req, res) => {
  try {
    const { param } = req.params;

    // Check if it's a valid MongoDB ObjectId (24 character hex string)
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      const country = await Country.findById(param);
      if (country) {
        return res.json({
          success: true,
          data: country
        });
      }
    }

    // If not found by ID or not a valid ObjectId, try as slug
    const country = await Country.findOne({ slug: param });
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      data: country
    });

  } catch (error) {
    logger.error('Get country error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country',
      error: error.message
    });
  }
};

module.exports = {
  createCountry,
  getCountries,
  getCountryBySlug,
  getCountryById,
  updateCountry,
  toggleCountryStatus,
  deleteCountry
};