const express = require('express');
const router = express.Router();
const {
  getAllTestimonials,
  getFeaturedTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialsControllers');
const {
  uploadTestimonialImage,
  handleUploadErrors,
  validateTestimonialData,
  validateTestimonialId,
  checkDuplicateTestimonial
} = require('../middlewares/testimonialsMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Student testimonials management endpoints
 */

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all testimonials with pagination (Public)
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of testimonials per page
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured testimonials only
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of testimonials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Testimonial'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 */
router.route('/')
  .get(getAllTestimonials);

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a new testimonial (Admin/Moderator only)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - country
 *               - quote
 *               - image
 *               - rating
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Anita Gurung"
 *                 pattern: '^[a-zA-Z\s]+$'
 *                 minLength: 2
 *                 maxLength: 100
 *               country:
 *                 type: string
 *                 example: "United States"
 *                 minLength: 2
 *                 maxLength: 100
 *               quote:
 *                 type: string
 *                 example: "EduConnect helped me get into my dream university with full scholarship! The counselors were extremely helpful throughout the entire process."
 *                 minLength: 20
 *                 maxLength: 500
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Student profile image
 *               rating:
 *                 type: integer
 *                 example: 5
 *                 minimum: 1
 *                 maximum: 5
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 default: true
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Testimonial'
 *       400:
 *         description: Validation error or duplicate testimonial
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.route('/')
  .post(
    authMiddleware,
    authorizeRoles('admin', 'moderator'),
    uploadTestimonialImage,
    handleUploadErrors,
    validateTestimonialData,
    checkDuplicateTestimonial,
    createTestimonial
  );

/**
 * @swagger
 * /api/testimonials/featured:
 *   get:
 *     summary: Get featured testimonials (Public)
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *         description: Number of featured testimonials to return
 *     responses:
 *       200:
 *         description: Featured testimonials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Testimonial'
 *                 count:
 *                   type: integer
 *                   example: 6
 *       500:
 *         description: Internal server error
 */
router.get('/featured', getFeaturedTestimonials);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   get:
 *     summary: Get testimonial by ID (Public)
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Testimonial ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Testimonial retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Testimonial'
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .get(validateTestimonialId, getTestimonialById);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update a testimonial (Admin/Moderator only)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Testimonial ID (must be a valid MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Anita Gurung Updated"
 *                 pattern: '^[a-zA-Z\s]+$'
 *                 minLength: 2
 *                 maxLength: 100
 *               country:
 *                 type: string
 *                 example: "Canada"
 *                 minLength: 2
 *                 maxLength: 100
 *               quote:
 *                 type: string
 *                 example: "Updated testimonial quote about the excellent service provided by EduConnect."
 *                 minLength: 20
 *                 maxLength: 500
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New student profile image (optional)
 *               rating:
 *                 type: integer
 *                 example: 4
 *                 minimum: 1
 *                 maximum: 5
 *               isFeatured:
 *                 type: boolean
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Testimonial'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .put(
    authMiddleware,
    authorizeRoles('admin', 'moderator'),
    validateTestimonialId,
    uploadTestimonialImage,
    handleUploadErrors,
    validateTestimonialData,
    updateTestimonial
  );

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial (Admin/Moderator only)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Testimonial ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Testimonial deleted successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.route('/:id')
  .delete(
    authMiddleware,
    authorizeRoles('admin', 'moderator'),
    validateTestimonialId,
    deleteTestimonial
  );

module.exports = router;