const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  generateStudentReport
} = require('../controllers/studentController');
const {
  validateStudentData,
  checkDuplicateStudent
} = require('../middlewares/studentMiddleware');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student consultation and inquiry management endpoints
 */

/**
 * @swagger
 * /api/student:
 *   post:
 *     summary: Create a new student consultation entry (Public)
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - mobile
 *               - office
 *               - topics
 *               - destinations
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Raj"
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 example: "Sharma"
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "raj.sharma@example.com"
 *               mobile:
 *                 type: string
 *                 example: "+9779841234567"
 *                 pattern: '^\+977\d{10}$'
 *                 description: Must be in format +977XXXXXXXXXX
 *               office:
 *                 type: string
 *                 enum: [Kathmandu, Pokhara]
 *                 example: "Kathmandu"
 *               topics:
 *                 type: string
 *                 example: "University Admission, Visa Process, Scholarship"
 *                 minLength: 5
 *                 maxLength: 500
 *               destinations:
 *                 type: string
 *                 example: "USA, Canada, Australia"
 *                 minLength: 2
 *                 maxLength: 200
 *               otherDestination:
 *                 type: string
 *                 example: "Germany"
 *                 maxLength: 100
 *               slc:
 *                 type: string
 *                 example: "3.65 GPA"
 *                 default: "N/A"
 *               plusTwo:
 *                 type: string
 *                 example: "3.45 GPA"
 *                 default: "N/A"
 *               bachelor:
 *                 type: string
 *                 example: "3.8 CGPA"
 *                 default: "N/A"
 *               healthIssues:
 *                 type: string
 *                 example: "None"
 *                 default: "None"
 *               additionalInfo:
 *                 type: string
 *                 example: "Interested in Computer Science programs with scholarship opportunities"
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Student consultation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error or duplicate student found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  validateStudentData,
  checkDuplicateStudent,
  createStudent
);

/**
 * @swagger
 * /api/student:
 *   get:
 *     summary: Get all students with pagination (Admin/Moderator/Counselor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
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
 *           maximum: 100
 *           default: 20
 *         description: Number of students per page
 *       - in: query
 *         name: office
 *         schema:
 *           type: string
 *           enum: [Kathmandu, Pokhara]
 *         description: Filter by office location
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination countries
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, contacted, enrolled, rejected]
 *         description: Filter by consultation status
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
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
 *                     $ref: '#/components/schemas/Student'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator/Counselor access required
 *       500:
 *         description: Internal server error
 */
router.get(
  '/', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator', 'counselor'), 
  getAllStudents
);

/**
 * @swagger
 * /api/student/{id}:
 *   get:
 *     summary: Get student by ID (Admin/Moderator/Counselor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Student ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator/Counselor access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator', 'counselor'), 
  getStudentById
);

/**
 * @swagger
 * /api/student/{id}:
 *   put:
 *     summary: Update a student consultation (Admin/Moderator/Counselor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Student ID (must be a valid MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Rajendra"
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 example: "Sharma"
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "rajendra.sharma@example.com"
 *               mobile:
 *                 type: string
 *                 example: "+9779841234567"
 *                 pattern: '^\+977\d{10}$'
 *               office:
 *                 type: string
 *                 enum: [Kathmandu, Pokhara]
 *                 example: "Pokhara"
 *               topics:
 *                 type: string
 *                 example: "University Admission, Visa Process, Scholarship, Accommodation"
 *                 minLength: 5
 *                 maxLength: 500
 *               destinations:
 *                 type: string
 *                 example: "USA, Canada"
 *                 minLength: 2
 *                 maxLength: 200
 *               otherDestination:
 *                 type: string
 *                 example: ""
 *                 maxLength: 100
 *               slc:
 *                 type: string
 *                 example: "3.70 GPA"
 *               plusTwo:
 *                 type: string
 *                 example: "3.50 GPA"
 *               bachelor:
 *                 type: string
 *                 example: "3.9 CGPA"
 *               healthIssues:
 *                 type: string
 *                 example: "Asthma"
 *               additionalInfo:
 *                 type: string
 *                 example: "Updated additional information"
 *                 maxLength: 1000
 *               status:
 *                 type: string
 *                 enum: [pending, contacted, enrolled, rejected]
 *                 example: "contacted"
 *               counselorNotes:
 *                 type: string
 *                 example: "Student seems very interested in Computer Science programs"
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator/Counselor access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator', 'counselor'), 
  validateStudentData, 
  updateStudent
);

/**
 * @swagger
 * /api/student/{id}:
 *   delete:
 *     summary: Delete a student consultation (Admin/Moderator only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Student ID (must be a valid MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Student deleted successfully
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
 *                       example: "Student consultation deleted successfully"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  deleteStudent
);

/**
 * @swagger
 * /api/student/{id}/report:
 *   get:
 *     summary: Generate student consultation report (Admin/Moderator/Counselor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         description: Student ID (must be a valid MongoDB ObjectId)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, json]
 *           default: json
 *         description: Report format
 *     responses:
 *       200:
 *         description: Student report generated successfully
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
 *                     student:
 *                       $ref: '#/components/schemas/Student'
 *                     report:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: string
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin/Moderator/Counselor access required
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/report', 
  authMiddleware, 
  authorizeRoles('admin', 'moderator'), 
  generateStudentReport
);

module.exports = router;