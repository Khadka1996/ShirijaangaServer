const express = require('express');
const router = express.Router();
const {
  createCountry,
  getCountries,
  getCountryBySlug,
  getCountryById, // Add this
  updateCountry,
  toggleCountryStatus,
  deleteCountry
} = require('../controllers/CountryController');
const {
  uploadCountryImage,
  cleanupCountryImage
} = require('../middlewares/CountryMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getCountries);
router.get('/slug/:slug', getCountryBySlug); // Specific route for slugs
router.get('/:param', getCountryById); // This handles both ID and slug
router.get('/study-abroad/:slug', getCountryBySlug);

// Protected admin/moderator routes
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  uploadCountryImage,
  cleanupCountryImage,
  createCountry
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  uploadCountryImage,
  cleanupCountryImage,
  updateCountry
);

router.patch(
  '/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  toggleCountryStatus
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  deleteCountry
);

module.exports = router;