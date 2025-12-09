const Team = require('../models/teamModel');
const { logger } = require('../utils/logger.util');
const { promisify } = require('util');
const fs = require('fs');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');

// Get all team members with pagination and filtering - UPDATED
exports.getAllTeamMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'displayOrder';
    const skip = (page - 1) * limit;

    // Build sort object
    const sortOptions = {};
    if (sortBy === 'displayOrder') {
      sortOptions.displayOrder = 1;
    } else if (sortBy === 'name') {
      sortOptions.name = 1;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = -1;
    } else {
      sortOptions.displayOrder = 1; // Default
    }

    // Get total count for pagination
    const total = await Team.countDocuments();
    
    // Get paginated results
    const teamMembers = await Team.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-__v -createdAt -updatedAt');

    logger.info(`Fetched ${teamMembers.length} team members with pagination`);
    
    res.status(200).json({
      success: true,
      count: teamMembers.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: teamMembers
    });
  } catch (err) {
    logger.error('Error fetching team members:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members'
    });
  }
};

// Get active team members for frontend display (limited) - NEW
exports.getActiveTeamMembers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const maxLimit = Math.min(limit, 10);

    const teamMembers = await Team.find({ 
      displayOrder: { $gte: 0 } // Only visible members
    })
    .sort({ displayOrder: 1 })
    .limit(maxLimit)
    .select('name role image displayOrder');

    logger.info(`Fetched ${teamMembers.length} active team members for frontend`);
    
    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (err) {
    logger.error('Error fetching active team members:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members'
    });
  }
};

// Create a new team member - UPDATED
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role } = req.body;
    
    if (!req.file) {
      logger.warn('No image uploaded for team member');
      return res.status(400).json({
        success: false,
        message: 'Team member image is required'
      });
    }

    // Get the highest displayOrder and add 1 for new visible member
    const lastMember = await Team.findOne({ displayOrder: { $gte: 0 } }).sort('-displayOrder');
    const nextDisplayOrder = lastMember ? lastMember.displayOrder + 1 : 0;

    const imagePath = `/uploads/team/${req.file.filename}`;

    const newTeamMember = await Team.create({
      name,
      role,
      image: imagePath,
      displayOrder: nextDisplayOrder // Auto-assigned unique order
    });

    logger.info(`Created new team member: ${newTeamMember.name} with order ${nextDisplayOrder}`);
    res.status(201).json({
      success: true,
      data: newTeamMember
    });
  } catch (err) {
    logger.error('Error creating team member:', err);
    
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup team image:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create team member'
    });
  }
};

// Update a team member - UPDATED
exports.updateTeamMember = async (req, res) => {
  try {
    const { name, role, displayOrder } = req.body;
    const updateData = { name, role };
    
    // Only update displayOrder if provided and valid
    if (displayOrder !== undefined && displayOrder >= 0) {
      updateData.displayOrder = displayOrder;
    }
    
    if (req.file) {
      updateData.image = `/uploads/team/${req.file.filename}`;
      
      // Delete old image
      const existingMember = await Team.findById(req.params.id);
      if (existingMember && existingMember.image) {
        const oldImagePath = path.join(__dirname, '../', existingMember.image);
        try {
          await unlinkAsync(oldImagePath);
        } catch (cleanupErr) {
          logger.error('Failed to delete old team image:', cleanupErr);
        }
      }
    }

    const updatedTeamMember = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTeamMember) {
      logger.warn(`Team member not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    logger.info(`Updated team member: ${updatedTeamMember.name}`);
    res.status(200).json({
      success: true,
      data: updatedTeamMember
    });
  } catch (err) {
    logger.error('Error updating team member:', err);
    
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupErr) {
        logger.error('Failed to cleanup team image:', cleanupErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update team member'
    });
  }
};

// Delete a team member
exports.deleteTeamMember = async (req, res) => {
  try {
    const teamMember = await Team.findByIdAndDelete(req.params.id);

    if (!teamMember) {
      logger.warn(`Team member not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Delete associated image
    if (teamMember.image) {
      const imagePath = path.join(__dirname, '../', teamMember.image);
      try {
        await unlinkAsync(imagePath);
      } catch (cleanupErr) {
        logger.error('Failed to delete team image:', cleanupErr);
      }
    }

    logger.info(`Deleted team member: ${teamMember.name}`);
    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (err) {
    logger.error('Error deleting team member:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team member'
    });
  }
};

// Reorder team members - UPDATED
exports.reorderTeamMembers = async (req, res) => {
  try {
    const { order } = req.body;
    
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order array provided'
      });
    }

    // Validate each item in the order array
    for (const item of order) {
      if (!item.id || typeof item.displayOrder !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each order item must have "id" and "displayOrder" properties'
        });
      }
    }

    const bulkOps = order.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { displayOrder: item.displayOrder } }
      }
    }));

    const result = await Team.bulkWrite(bulkOps);

    logger.info(`Updated ${result.modifiedCount} team members order`);
    res.status(200).json({
      success: true,
      message: 'Team members order updated successfully',
      data: {
        updatedCount: result.modifiedCount
      }
    });
  } catch (err) {
    logger.error('Error reordering team members:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder team members'
    });
  }
};

// Toggle team member visibility - NEW
exports.toggleTeamMemberVisibility = async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    
    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Toggle between visible and hidden
    if (teamMember.displayOrder >= 0) {
      // Hide: set to -1
      teamMember.displayOrder = -1;
    } else {
      // Show: assign next available order
      const lastMember = await Team.findOne({ displayOrder: { $gte: 0 } }).sort('-displayOrder');
      teamMember.displayOrder = lastMember ? lastMember.displayOrder + 1 : 0;
    }

    await teamMember.save();

    logger.info(`Toggled team member visibility: ${teamMember.name} -> ${teamMember.displayOrder >= 0 ? 'Visible' : 'Hidden'}`);
    
    res.status(200).json({
      success: true,
      data: {
        id: teamMember._id,
        name: teamMember.name,
        displayOrder: teamMember.displayOrder,
        isActive: teamMember.displayOrder >= 0,
        message: `Team member ${teamMember.displayOrder >= 0 ? 'shown' : 'hidden'} successfully`
      }
    });
  } catch (err) {
    logger.error('Error toggling team member visibility:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle team member visibility'
    });
  }
};