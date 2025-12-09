const Testimonial = require('../models/testimonialsModel');
const asyncHandler = require('express-async-handler');
const fs = require('fs').promises;
const path = require('path'); // Added path module import

// Get all testimonials with pagination, filtering, and sorting
const getAllTestimonials = asyncHandler(async (req, res) => {
  const { pageSize = 10, page = 1, sortBy = '-createdAt', country, search } = req.query;

  const query = {};
  if (country) query.country = { $regex: country, $options: 'i' };
  if (search) query.$text = { $search: search };

  const [count, testimonials] = await Promise.all([
    Testimonial.countDocuments(query),
    Testimonial.find(query)
      .select('name country quote image rating isFeatured createdAt')
      .sort(sortBy)
      .limit(Number(pageSize))
      .skip(Number(pageSize) * (Number(page) - 1))
      .lean(),
  ]);

  res.json({
    success: true,
    count,
    page: Number(page),
    pages: Math.ceil(count / pageSize),
    data: testimonials,
  });
});

// Get featured testimonials (limit to 3)
const getFeaturedTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isFeatured: true })
    .select('name country quote image rating createdAt')
    .sort('-createdAt')
    .limit(3)
    .lean();
  res.json({ success: true, data: testimonials });
});

// Get single testimonial
const getTestimonialById = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id).lean();
  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }
  res.json({ success: true, data: testimonial });
});

// Create new testimonial
const createTestimonial = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.image = `/uploads/testimonials/${req.file.filename}`;
  } else {
    res.status(400);
    throw new Error('Image file is required');
  }

  try {
    const testimonial = await Testimonial.create(data);
    res.status(201).json({ success: true, data: testimonial });
  } catch (err) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400);
    throw new Error(err.message);
  }
});

// Update testimonial
const updateTestimonial = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.image = `/uploads/testimonials/${req.file.filename}`;
    // Delete the old image if it exists
    const oldTestimonial = await Testimonial.findById(req.params.id);
    if (oldTestimonial?.image) {
      const oldImagePath = path.join(__dirname, '..', oldTestimonial.image);
      await fs.unlink(oldImagePath).catch((err) => console.error('Failed to delete old image:', err));
    }
  }

  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!testimonial) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      res.status(404);
      throw new Error('Testimonial not found');
    }
    res.json({ success: true, data: testimonial });
  } catch (err) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400);
    throw new Error(err.message);
  }
});

// Delete testimonial
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }
  // Delete associated image
  if (testimonial.image) {
    const imagePath = path.join(__dirname, '..', testimonial.image);
    await fs.unlink(imagePath).catch((err) => console.error('Failed to delete image:', err));
  }
  res.json({ success: true, message: 'Deleted successfully' });
});

module.exports = {
  getAllTestimonials,
  getFeaturedTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};