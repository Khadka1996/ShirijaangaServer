const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors'); 
const { logger } = require('./utils/logger.util');
require('dotenv').config();
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Import Swagger
const { swaggerUi, specs } = require('./swagger');

// Import middlewares
const { uploadBlogImage, handleUploadErrors } = require('./middlewares/blogMiddleware');
const errorHandler = require('./middlewares/error.middleware');

// Import Email Cron Jobs
const emailCron = require('./utils/emailCron');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Cookie',
    'X-Session-ID',
    'x-session-id',  
    'X-Client-Fingerprint',  
    'x-client-fingerprint',  
    'X-User-Agent',         
    'x-user-agent'           
  ]
}));

// Handle preflight requests
app.options('*', cors());

// Enhanced Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Enhanced Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Security middlewares
app.use(mongoSanitize());
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Swagger Documentation Setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb; }
    .swagger-ui .btn.authorize { background-color: #2563eb; border-color: #2563eb; }
    .swagger-ui .btn.authorize:hover { background-color: #1d4ed8; }
  `,
  customSiteTitle: 'EduConnect API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
  }
}));


// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// MongoDB connection
const dbURI = process.env.MONGO_URI;
if (!dbURI) {
  logger.error('MONGO_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
    maxPoolSize: 50,
    wtimeoutMS: 25000,
  })
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to DB');
});
mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from DB');
});

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created directory: ${uploadsDir}`);
}

app.use('/uploads',
  (req, res, next) => {
    logger.info(`Static file request: ${req.originalUrl}`);
    next();
  },
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/' + filePath.split('.').pop());
      }
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    },
  })
);

app.post('/uploads',
  uploadBlogImage,
  handleUploadErrors,
  async (req, res) => {
    try {
      if (!req.file) {
        logger.warn('No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded or upload failed',
        });
      }

      logger.info(`File uploaded successfully: ${req.file.filename}`);
      res.json({
        success: true,
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (err) {
      logger.error('Upload processing error:', err);
      if (req.file) {
        try {
          await unlinkAsync(req.file.path);
        } catch (cleanupErr) {
          logger.error('File cleanup error:', cleanupErr);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// API Routes
app.use('/api/ads', require('./routes/adsRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/testimonials', require('./routes/testimonialsRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/counselors', require('./routes/counselorsRoutes'));
app.use('/api/countries', require('./routes/CountryRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "UP"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-05T14:48:00.000Z"
 *                 dbState:
 *                   type: integer
 *                   description: MongoDB connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
 *                   example: 1
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600.25
 *                 memoryUsage:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: integer
 *                       example: 102400000
 *                     heapTotal:
 *                       type: integer
 *                       example: 51200000
 *                     heapUsed:
 *                       type: integer
 *                       example: 25600000
 *                     external:
 *                       type: integer
 *                       example: 12800000
 *                 env:
 *                   type: string
 *                   example: "development"
 */
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development',
  };
  res.status(200).json(healthStatus);
});

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Swagger API Documentation
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Returns Swagger UI documentation
 */
app.get('/api-docs', (req, res) => {
  res.redirect('/api-docs');
});

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error Handler
app.use(errorHandler);

server.listen(PORT, () => {
  console.log('\n');
  console.log(`                    ███╗   ███╗   ███╗   ██╗   ███████╗`);
  console.log(`                    ████╗ ████║   ████╗  ██║   ╚══███╔╝`);
  console.log(`                    ██╔████╔██║   ██╔██╗ ██║     ███╔╝ `);
  console.log(`                    ██║╚██╔╝██║   ██║╚██╗██║    ███╔╝  `);
  console.log(`                    ██║ ╚═╝ ██║   ██║ ╚████║   ███████╗`);
  console.log(`                    ╚═╝     ╚═╝   ╚═╝  ╚═══╝   ╚══════╝\n`);
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`Health Check: http://localhost:${PORT}/health`);
  logger.info(`MNZ SYSTEM FULLY OPERATIONAL — AUTHORITY ENGAGED`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;