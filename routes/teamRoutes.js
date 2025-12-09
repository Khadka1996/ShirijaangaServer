const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { uploadTeamImage, cleanupTeamImage } = require('../middlewares/teamMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Team
 *   description: Team members management endpoints
 */

/**
 * @swagger
 * /api/team:
 *   get:
 *     summary: Get all team members with pagination (Public)
 *     tags: [Team]
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
 *           default: 20
 *         description: Number of team members per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [displayOrder, name, createdAt]
 *           default: displayOrder
 *         description: Sort team members by field
 *     responses:
 *       200:
 *         description: List of team members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     hasNext:
 *                       type: boolean
 *                       example: false
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       500:
 *         description: Internal server error
 */
router.get('/', teamController.getAllTeamMembers);

/**
 * @swagger
 * /api/team/active:
 *   get:
 *     summary: Get active team members for frontend display (Public)
 *     tags: [Team]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of team members to return (max 10)
 *     responses:
 *       200:
 *         description: Active team members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       500:
 *         description: Internal server error
 */
router.get('/active', teamController.getActiveTeamMembers);

/**
 * @swagger
 * /api/team:
 *   post:
 *     summary: Create a new team member (Admin/Moderator only)
 *     tags: [Team]
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
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sarah Johnson"
 *                 minLength: 2
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "CEO & Founder"
 *                 minLength: 2
 *                 maxLength: 100
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Team member profile image
 *     responses:
 *       201:
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
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
  uploadTeamImage,
  cleanupTeamImage,
  teamController.createTeamMember
);

/**
 * @swagger
 * /api/team/{id}:
 *   put:
 *     summary: Update a team member (Admin/Moderator only)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Team member ID (must be a valid MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sarah Johnson Updated"
 *                 minLength: 2
 *                 maxLength: 100
 *               role:
 *                 type: string
 *                 example: "CEO, Founder & Lead Consultant"
 *                 minLength: 2
 *                 maxLength: 100
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New team member profile image (optional)
 *               displayOrder:
 *                 type: integer
 *                 example: 2
 *                 minimum: 0
 *                 description: Set display order (0 or higher for visible, -1 for hidden)
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  uploadTeamImage,
  cleanupTeamImage,
  teamController.updateTeamMember
);

/**
 * @swagger
 * /api/team/{id}/toggle:
 *   patch:
 *     summary: Toggle team member visibility (Admin/Moderator only)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Team member ID
 *     responses:
 *       200:
 *         description: Team member visibility toggled successfully
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
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439015"
 *                     name:
 *                       type: string
 *                       example: "Sarah Johnson"
 *                     displayOrder:
 *                       type: integer
 *                       example: 2
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Team member shown successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/toggle',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  teamController.toggleTeamMemberVisibility
);

/**
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete a team member (Admin/Moderator only)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Team member ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Team member deleted successfully
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
 *                       example: "Team member deleted successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Team member not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  teamController.deleteTeamMember
);

/**
 * @swagger
 * /api/team/reorder:
 *   post:
 *     summary: Reorder team members (Admin/Moderator only)
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - displayOrder
 *                   properties:
 *                     id:
 *                       type: string
 *                       pattern: '^[a-fA-F0-9]{24}$'
 *                       example: "507f1f77bcf86cd799439015"
 *                     displayOrder:
 *                       type: integer
 *                       example: 3
 *                       minimum: 0
 *                       description: Display order (0 or higher for visible positions)
 *     responses:
 *       200:
 *         description: Team members reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Team members order updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Invalid order data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reorder',
  authMiddleware,
  authorizeRoles('admin', 'moderator'),
  teamController.reorderTeamMembers
);

module.exports = router;