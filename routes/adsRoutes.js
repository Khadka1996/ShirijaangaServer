const express = require('express');
const router = express.Router();
const adsController = require('../controllers/adsController');
const { uploadAdImage, cleanupAdImage, validateAdvertisement } = require('../middlewares/adsMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', adsController.getAllAdvertisements);
router.get('/public', adsController.getPublicAds); // For public display
router.get('/position/:position', adsController.getAdsByPosition);
router.get('/serve/:id', adsController.serveAdvertisement); // Track impression
router.get('/click/:id', adsController.trackClick); // Track click

// Protected routes (Admin/Moderator only)
router.post(
  '/', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  uploadAdImage,
  cleanupAdImage,
  validateAdvertisement, 
  adsController.createAdvertisement
);

router.get('/stats', authMiddleware, authorizeRoles('admin', 'moderator'), adsController.getAdStats);
router.get('/:id', adsController.getAdvertisementById);

router.put(
  '/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  uploadAdImage, // Image is optional for update
  cleanupAdImage,
  validateAdvertisement, 
  adsController.updateAdvertisement
);

router.patch(
  '/:id/status',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  adsController.toggleAdStatus
);

router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  adsController.deleteAdvertisement
);

module.exports = router;