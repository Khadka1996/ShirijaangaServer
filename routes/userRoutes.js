const express = require("express");
const router = express.Router();
const passport = require('../config/passport');
const userController = require("../controllers/userController");
const { 
  authMiddleware,
  authorizeRoles,
  sessionAwareAuth 
} = require("../middlewares/authMiddleware.js");
const { 
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUserIdParam,
  validateChangeUserRole
} = require("../middlewares/userValidation");
const {
  uploadProfileImage,
  processProfileImage,
  cleanupProfileImage
} = require('../middlewares/userMiddleware.js');
// Role protection middleware
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// Session validation middleware (for routes that need session management)
const requireSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  
  if (!sessionId) {
    return res.status(400).json({
      status: 'fail',
      message: 'Session ID required. Please include x-session-id header.'
    });
  }
  
  next();
};

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication & session management
 *   - name: Users
 *     description: User profile, sessions, and trusted devices
 *   - name: Admin
 *     description: Admin-only user management operations
 *   - name: Moderator
 *     description: Moderator content management
 *   - name: Social Auth
 *     description: Social media authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "507f1f77bcf86cd799439011"
 *         username:
 *           type: string
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [user, moderator, admin]
 *           example: "user"
 *         active:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: "2023-10-05T14:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Session:
 *       type: object
 *       properties:
 *         sessionId:
 *           type: string
 *           example: "a1b2c3d4e5f6g7h8i9j0"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         deviceInfo:
 *           type: string
 *           example: "Chrome on Windows"
 *         userAgent:
 *           type: string
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         ip:
 *           type: string
 *           example: "192.168.1.100"
 *         location:
 *           type: string
 *           example: "US"
 *         lastActive:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         current:
 *           type: boolean
 *           example: false
 * 
 *     TrustedDevice:
 *       type: object
 *       properties:
 *         fingerprint:
 *           type: string
 *           example: "device_fingerprint_abc123"
 *         name:
 *           type: string
 *           example: "Chrome on Windows"
 *         lastUsed:
 *           type: string
 *           format: date-time
 *         userAgent:
 *           type: string
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         addedAt:
 *           type: string
 *           format: date-time
 * 
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "fail"
 *         code:
 *           type: string
 *           example: "VALIDATION_ERROR"
 *         message:
 *           type: string
 *           example: "Validation failed"
 * 
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "success"
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 *         data:
 *           type: object
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   parameters:
 *     userIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *       description: MongoDB User ID
 * 
 *     sessionIdParam:
 *       in: path
 *       name: sessionId
 *       required: true
 *       schema:
 *         type: string
 *       description: Session ID
 * 
 *     deviceFingerprintParam:
 *       in: path
 *       name: fingerprint
 *       required: true
 *       schema:
 *         type: string
 *       description: Device fingerprint
 * 
 *     resetTokenParam:
 *       in: path
 *       name: token
 *       required: true
 *       schema:
 *         type: string
 *       description: Password reset token
 * 
 *     sessionIdHeader:
 *       in: header
 *       name: x-session-id
 *       required: true
 *       schema:
 *         type: string
 *       description: Current session ID
 * 
 *     paginationPage:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Page number
 * 
 *     paginationLimit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *       description: Number of items per page
 */

// ========================
// AUTH ROUTES (Public)
// ========================

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         sessionId:
 *                           type: string
 *                           description: Session ID for subsequent requests
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.post("/register", validateRegister, userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=abc123; HttpOnly; Path=/; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         sessionId:
 *                           type: string
 *                           description: Session ID for subsequent requests
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 *       423:
 *         description: Account temporarily locked
 */
router.post("/login", validateLogin, userController.login);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout from current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
router.post("/logout", authMiddleware, userController.logout);

/**
 * @swagger
 * /api/users/refresh-token:
 *   post:
 *     summary: Refresh JWT access token
 *     tags: [Auth]
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: New tokens issued
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "token=newjwt; HttpOnly; Path=/; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", userController.refreshToken);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Reset link sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", validateForgotPassword, userController.forgotPassword);

/**
 * @swagger
 * /api/users/reset-password/{token}:
 *   patch:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     parameters:
 *       - $ref: '#/components/parameters/resetTokenParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecurePass123!"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid token or validation error
 *       410:
 *         description: Token expired
 */
router.patch("/reset-password/:token", validateResetPassword, userController.resetPassword);

// ========================
// PROTECTED USER ROUTES
// ========================

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: Returns current user profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get("/me", authMiddleware, userController.getMe);

/**
 * @swagger
 * /api/users/update-profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "new_username"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.patch("/update-profile", authMiddleware, validateUpdateUser, userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change password (logs out all devices)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "CurrentPass123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewPass123!"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewPass123!"
 *     responses:
 *       200:
 *         description: Password changed - all sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Not authenticated
 */
router.post("/change-password", authMiddleware, validateChangePassword, userController.changePassword);

/**
 * @swagger
 * /api/users/deactivate:
 *   delete:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
router.delete("/deactivate", authMiddleware, userController.deactivateAccount);

// ========================
// SESSION MANAGEMENT ROUTES
// ========================

/**
 * @swagger
 * /api/users/sessions:
 *   get:
 *     summary: List all active sessions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: Active sessions with current marked
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sessions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Session'
 *       401:
 *         description: Not authenticated
 */
router.get("/sessions", authMiddleware, requireSession, userController.getActiveSessions);

/**
 * @swagger
 * /api/users/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke specific session
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/sessionIdParam'
 *     responses:
 *       200:
 *         description: Session terminated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot revoke current session
 *       404:
 *         description: Session not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/sessions/:sessionId", authMiddleware, requireSession, userController.revokeSession);

/**
 * @swagger
 * /api/users/sessions:
 *   delete:
 *     summary: Revoke all other sessions (keep current)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: All other devices logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
router.delete("/sessions", authMiddleware, requireSession, userController.revokeAllSessions);

// ========================
// TRUSTED DEVICES ROUTES
// ========================

/**
 * @swagger
 * /api/users/trusted-devices:
 *   get:
 *     summary: List trusted devices
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: Devices that won't trigger new device alerts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         devices:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TrustedDevice'
 *       401:
 *         description: Not authenticated
 */
router.get("/trusted-devices", authMiddleware, userController.getTrustedDevices);

/**
 * @swagger
 * /api/users/trusted-devices/{fingerprint}:
 *   delete:
 *     summary: Remove trusted device
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/deviceFingerprintParam'
 *     responses:
 *       200:
 *         description: Device removed from trusted list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Trusted device not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/trusted-devices/:fingerprint", authMiddleware, userController.removeTrustedDevice);

// ========================
// SOCIAL AUTH ROUTES
// ========================

/**
 * @swagger
 * /api/users/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Social Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/users/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Social Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 */
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  userController.socialLoginSuccess
);

/**
 * @swagger
 * /api/users/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Social Auth]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth
 */
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @swagger
 * /api/users/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Social Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 */
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  userController.socialLoginSuccess
);

// ========================
// MODERATOR ROUTES
// ========================

/**
 * @swagger
 * /api/users/moderator/pending:
 *   get:
 *     summary: Get pending moderation items (Moderator+)
 *     tags: [Moderator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *     responses:
 *       200:
 *         description: List of pending moderation items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Not authenticated
 */
router.get("/moderator/pending", authMiddleware, restrictTo("moderator", "admin"), userController.getPendingModerationItems);

/**
 * @swagger
 * /api/users/moderator/approve/{id}:
 *   patch:
 *     summary: Approve content (Moderator+)
 *     tags: [Moderator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Moderation item ID
 *     responses:
 *       200:
 *         description: Content approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Moderation item not found
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Not authenticated
 */
router.patch("/moderator/approve/:id", authMiddleware, restrictTo("moderator", "admin"), userController.approveContent);

// ========================
// ADMIN ROUTES
// ========================

/**
 * @swagger
 * /api/users/admin/audit-logs:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Not authenticated
 */
router.get("/admin/audit-logs", authMiddleware, restrictTo("admin"), userController.getAuditLogs);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, moderator, admin]
 *         description: Filter by role
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users with pagination
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             currentPage:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get("/", authMiddleware, restrictTo("admin"), userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get("/:id", authMiddleware, restrictTo("admin"), validateUserIdParam, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, moderator, admin]
 *                 example: "moderator"
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or cannot change own role
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.patch("/:id/role", authMiddleware, restrictTo("admin"), validateUserIdParam, validateChangeUserRole, userController.changeUserRole);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot delete own account
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.delete("/:id", authMiddleware, restrictTo("admin"), validateUserIdParam, userController.deleteUser);
/**
 * @swagger
 * /api/users/{id}/profile-image:
 *   put:
 *     summary: Update user profile picture (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sessionIdHeader'
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: Invalid input or unsupported file format
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put(
  "/:id/profile-image",
  authMiddleware,
  restrictTo("admin"),
  validateUserIdParam,
  uploadProfileImage,
  processProfileImage,
  userController.updateProfileImage
);
module.exports = router;