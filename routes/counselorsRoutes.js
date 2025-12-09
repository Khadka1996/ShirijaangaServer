const express = require('express');
const router = express.Router();
const counselorsController = require('../controllers/CounselorsController');
const {
  uploadCounselorImage,
  cleanupCounselorImage
} = require('../middlewares/CounselorsMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Counselors
 *   description: Education counselors management endpoints
 */

/**
 * @swagger
 * /api/counselors:
 *   get:
 *     summary: Get all counselors with filtering and pagination (Public)
 *     tags: [Counselors]
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
 *           default: 10
 *         description: Number of counselors per page
 *       - in: query
 *         name: expertise
 *         schema:
 *           type: string
 *         description: Filter by expertise field
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search counselors by name or role
 *     responses:
 *       200:
 *         description: List of counselors retrieved successfully
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
 *                     $ref: '#/components/schemas/Counselor'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 */
router.get('/', counselorsController.getAllCounselors);

/**
 * @swagger
 * /api/counselors/active:
 *   get:
 *     summary: Get counselors for frontend display (Public)
 *     tags: [Counselors]
 *     responses:
 *       200:
 *         description: Counselors retrieved successfully
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
 *                     $ref: '#/components/schemas/Counselor'
 *       500:
 *         description: Internal server error
 */
router.get('/active', counselorsController.getActiveCounselors);

/**
 * @swagger
 * /api/counselors/{id}:
 *   get:
 *     summary: Get counselor by ID (Public)
 *     tags: [Counselors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Counselor ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Counselor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Counselor'
 *       404:
 *         description: Counselor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/:id', counselorsController.getCounselor);

/**
 * @swagger
 * /api/counselors:
 *   post:
 *     summary: Create a new counselor (Admin/Moderator only)
 *     tags: [Counselors]
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
 *               - role
 *               - expertise
 *               - bio
 *               - certifications
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Smith"
 *                 minLength: 2
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "Senior Education Counselor"
 *                 minLength: 2
 *                 maxLength: 100
 *               expertise:
 *                 type: string
 *                 example: "USA & Canada Admissions"
 *                 minLength: 2
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 example: "10+ years of experience in education counseling with expertise in USA and Canada university admissions."
 *                 minLength: 10
 *                 maxLength: 1000
 *               certifications:
 *                 type: string
 *                 example: "ICEF Certified,PIER Certified"
 *                 description: Comma-separated list of certifications
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Counselor profile image
 *     responses:
 *       201:
 *         description: Counselor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Counselor'
 *       400:
 *         description: Validation error or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  uploadCounselorImage,
  cleanupCounselorImage,
  counselorsController.createCounselor
);

/**
 * @swagger
 * /api/counselors/{id}:
 *   patch:
 *     summary: Update a counselor (Admin/Moderator only)
 *     tags: [Counselors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Counselor ID (must be a valid MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Smith Updated"
 *                 minLength: 2
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "Lead Education Counselor"
 *                 minLength: 2
 *                 maxLength: 100
 *               expertise:
 *                 type: string
 *                 example: "USA, Canada & Australia Admissions"
 *                 minLength: 2
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 example: "12+ years of experience in education counseling with expertise in USA, Canada and Australia university admissions."
 *                 minLength: 10
 *                 maxLength: 1000
 *               certifications:
 *                 type: string
 *                 example: "ICEF Certified,PIER Certified,ICEF Advanced"
 *                 description: Comma-separated list of certifications
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New counselor profile image (optional)
 *     responses:
 *       200:
 *         description: Counselor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Counselor'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Counselor not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  uploadCounselorImage,
  cleanupCounselorImage,
  counselorsController.updateCounselor
);

/**
 * @swagger
 * /api/counselors/{id}:
 *   delete:
 *     summary: Delete a counselor (permanent deletion) (Admin/Moderator only)
 *     tags: [Counselors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Counselor ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Counselor permanently deleted successfully
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
 *                       example: "Counselor deleted successfully"
 *                     counselorId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439013"
 *                     name:
 *                       type: string
 *                       example: "John Smith"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Counselor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  counselorsController.deleteCounselor
);


module.exports = router;