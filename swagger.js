const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduConnect API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for EduConnect Express application',
      contact: {
        name: 'API Support',
        email: 'support@educonnect.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Error Response Schema
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message description'
            },
            message: {
              type: 'string',
              example: 'Detailed error message'
            }
          }
        },
        
        // Success Response Schema
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },

        // Pagination Schema
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 10
            },
            total: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 10
            }
          }
        },

          EmailConfig: {
          type: 'object',
          required: ['email', 'appPassword'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439030'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'noreply@educonnect.com',
              description: 'Email address for sending emails'
            },
            fromName: {
              type: 'string',
              example: 'EduConnect Consultancy',
              description: 'Display name for sent emails'
            },
            dailyLimit: {
              type: 'integer',
              example: 500,
              description: 'Daily email sending limit'
            },
            emailsSentToday: {
              type: 'integer',
              example: 45,
              description: 'Emails sent today'
            },
            monthlyEmailsSent: {
              type: 'integer',
              example: 1245,
              description: 'Emails sent this month'
            },
            totalEmailsSent: {
              type: 'integer',
              example: 12500,
              description: 'Total emails sent'
            },
            successRate: {
              type: 'number',
              format: 'float',
              example: 98.5,
              description: 'Email sending success rate percentage'
            },
            averageSendTime: {
              type: 'integer',
              example: 1200,
              description: 'Average email send time in milliseconds'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether this configuration is active'
            },
            lastResetDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T00:00:00.000Z'
            },
            currentMonth: {
              type: 'string',
              example: '2024-01',
              description: 'Current month for monthly tracking'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Promotional Email Schema
        PromotionalEmail: {
          type: 'object',
          required: ['title', 'content', 'buttonLink', 'contactEmail', 'contactPhone'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439031'
            },
            title: {
              type: 'string',
              example: 'Free Study Abroad Consultation',
              description: 'Email subject and title'
            },
            content: {
              type: 'string',
              example: 'Get free consultation for studying in USA, Canada, Australia. Limited spots available!',
              description: 'Email content body'
            },
            buttonText: {
              type: 'string',
              example: 'Book Now',
              description: 'Call-to-action button text'
            },
            buttonLink: {
              type: 'string',
              format: 'uri',
              example: 'https://educonnect.com/consultation',
              description: 'Call-to-action button URL'
            },
            contactEmail: {
              type: 'string',
              format: 'email',
              example: 'info@educonnect.com',
              description: 'Contact email displayed in email'
            },
            contactPhone: {
              type: 'string',
              example: '+977-1-1234567',
              description: 'Contact phone displayed in email'
            },
            sentCount: {
              type: 'integer',
              example: 150,
              description: 'Number of emails successfully sent'
            },
            failedCount: {
              type: 'integer',
              example: 5,
              description: 'Number of emails that failed to send'
            },
            totalRecipients: {
              type: 'integer',
              example: 155,
              description: 'Total number of recipients'
            },
            successRate: {
              type: 'number',
              format: 'float',
              example: 96.7,
              description: 'Campaign success rate percentage'
            },
            status: {
              type: 'string',
              enum: ['sending', 'completed', 'failed', 'cancelled'],
              example: 'completed',
              description: 'Campaign status'
            },
            progress: {
              type: 'integer',
              example: 100,
              description: 'Campaign progress percentage'
            },
            averageSendTime: {
              type: 'integer',
              example: 1500,
              description: 'Average send time per email in milliseconds'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:00:00.000Z'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z'
            },
            duration: {
              type: 'integer',
              example: 1800000,
              description: 'Total campaign duration in milliseconds'
            },
            configUsed: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439030'
                },
                email: {
                  type: 'string',
                  example: 'noreply@educonnect.com'
                },
                fromName: {
                  type: 'string',
                  example: 'EduConnect Consultancy'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Email Statistics Schema
        EmailStats: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              example: 'noreply@educonnect.com'
            },
            fromName: {
              type: 'string',
              example: 'EduConnect Consultancy'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            dailyLimit: {
              type: 'integer',
              example: 500
            },
            sentToday: {
              type: 'integer',
              example: 45
            },
            remainingToday: {
              type: 'integer',
              example: 455
            },
            lastReset: {
              type: 'string',
              format: 'date-time'
            },
            monthlySent: {
              type: 'integer',
              example: 1245
            },
            currentMonth: {
              type: 'string',
              example: '2024-01'
            },
            totalSent: {
              type: 'integer',
              example: 12500
            },
            totalFailed: {
              type: 'integer',
              example: 125
            },
            successRate: {
              type: 'number',
              format: 'float',
              example: 98.5
            },
            averageSendTime: {
              type: 'integer',
              example: 1200
            },
            consecutiveFailures: {
              type: 'integer',
              example: 0
            },
            lastSuccessfulSend: {
              type: 'string',
              format: 'date-time'
            },
            lastError: {
              type: 'string',
              example: 'SMTP connection timeout'
            },
            lastErrorAt: {
              type: 'string',
              format: 'date-time'
            },
            errorCount: {
              type: 'integer',
              example: 25
            },
            suspiciousActivityCount: {
              type: 'integer',
              example: 0
            },
            currentSession: {
              type: 'object',
              properties: {
                totalSends: {
                  type: 'integer',
                  example: 150
                },
                successCount: {
                  type: 'integer',
                  example: 148
                },
                errorCount: {
                  type: 'integer',
                  example: 2
                },
                averageSendTime: {
                  type: 'integer',
                  example: 1150
                }
              }
            }
          }
        },

        // Email Analytics Schema
        EmailAnalytics: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-15'
            },
            period: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
              example: 'daily'
            },
            emailsSent: {
              type: 'integer',
              example: 150
            },
            emailsFailed: {
              type: 'integer',
              example: 5
            },
            successRate: {
              type: 'number',
              format: 'float',
              example: 96.7
            },
            averageSendTime: {
              type: 'integer',
              example: 1250
            },
            peakSendingHour: {
              type: 'integer',
              example: 14,
              description: 'Hour with most emails sent (0-23)'
            },
            campaignsRun: {
              type: 'integer',
              example: 3
            },
            consecutiveFailures: {
              type: 'integer',
              example: 0
            },
            systemUptime: {
              type: 'number',
              format: 'float',
              example: 99.8,
              description: 'System uptime percentage'
            }
          }
        },

        // System Health Schema
        SystemHealth: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'critical'],
              example: 'healthy'
            },
            issues: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Low daily quota remaining: 50']
            },
            lastChecked: {
              type: 'string',
              format: 'date-time'
            },
            successRate: {
              type: 'number',
              format: 'float',
              example: 98.5
            },
            consecutiveFailures: {
              type: 'integer',
              example: 0
            },
            dailyLimit: {
              type: 'integer',
              example: 500
            },
            sentToday: {
              type: 'integer',
              example: 450
            },
            remainingToday: {
              type: 'integer',
              example: 50
            }
          }
        },

        // Cron Job Status Schema
        CronJobStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 0
            },
            scheduled: {
              type: 'boolean',
              example: true
            },
            nextDate: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Model Schemas based on your models
        Advertisement: {
          type: 'object',
          required: ['websiteLink', 'imagePath', 'position'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            websiteLink: {
              type: 'string',
              example: 'https://example.com'
            },
            imagePath: {
              type: 'string',
              example: 'ads/image.jpg'
            },
            position: {
              type: 'string',
              enum: [
                "top_banner", "sidebar_top", "sidebar_bottom", "footer", "popup_ad",
                "homepage_top", "homepage_bottom", "article_sidebar", "article_footer", "mobile_popup"
              ],
              example: 'top_banner'
            },
            uploadDate: {
              type: 'string',
              format: 'date-time',
              example: '2023-10-05T14:48:00.000Z'
            }
          }
        },

        Blog: {
          type: 'object',
          required: ['title', 'content', 'image'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            title: {
              type: 'string',
              example: 'How to Study Abroad Successfully'
            },
            slug: {
              type: 'string',
              example: 'how-to-study-abroad-successfully'
            },
            subheading: {
              type: 'string',
              example: 'A comprehensive guide for international students'
            },
            content: {
              type: 'string',
              example: 'Full blog content in HTML format...'
            },
            image: {
              type: 'string',
              example: 'blogs/image.jpg'
            },
            youtubeLink: {
              type: 'string',
              example: 'https://youtube.com/watch?v=abc123'
            },
            shareCount: {
              type: 'integer',
              example: 150
            },
            viewCount: {
              type: 'integer',
              example: 2500
            },
            likes: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['user1_id', 'user2_id']
            },
            isTrending: {
              type: 'boolean',
              example: true
            },
            isPublished: {
              type: 'boolean',
              example: true
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['study', 'abroad', 'education']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            likeCount: {
              type: 'integer',
              example: 25
            },
            commentCount: {
              type: 'integer',
              example: 12
            }
          }
        },

        // ADDED: Country Schema
        Country: {
          type: 'object',
          required: ['name', 'photo'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439025'
            },
            name: {
              type: 'string',
              example: 'United States',
              description: 'Country name (unique)'
            },
            photo: {
              type: 'string',
              example: 'countries/usa-flag.jpg',
              description: 'Country flag or representative image'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-10-05T14:48:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-10-05T14:48:00.000Z'
            }
          }
        },

        Counselor: {
          type: 'object',
          required: ['name', 'role', 'expertise', 'image', 'bio', 'certifications'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            name: {
              type: 'string',
              example: 'John Smith'
            },
            role: {
              type: 'string',
              example: 'Senior Education Counselor'
            },
            expertise: {
              type: 'string',
              example: 'USA & Canada Admissions'
            },
            image: {
              type: 'string',
              example: 'counselors/john-smith.jpg'
            },
            bio: {
              type: 'string',
              example: '10+ years of experience in education counseling...'
            },
            certifications: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['ICEF Certified', 'PIER Certified']
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Student: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'mobile', 'office', 'topics', 'destinations'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            firstName: {
              type: 'string',
              example: 'Raj'
            },
            lastName: {
              type: 'string',
              example: 'Sharma'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'raj.sharma@example.com'
            },
            mobile: {
              type: 'string',
              example: '+9779841234567'
            },
            office: {
              type: 'string',
              enum: ['Kathmandu', 'Pokhara'],
              example: 'Kathmandu'
            },
            topics: {
              type: 'string',
              example: 'University Admission, Visa Process'
            },
            destinations: {
              type: 'string',
              example: 'USA, Canada, Australia'
            },
            otherDestination: {
              type: 'string',
              example: 'Germany'
            },
            slc: {
              type: 'string',
              example: '3.65 GPA'
            },
            plusTwo: {
              type: 'string',
              example: '3.45 GPA'
            },
            bachelor: {
              type: 'string',
              example: '3.8 CGPA'
            },
            healthIssues: {
              type: 'string',
              example: 'None'
            },
            additionalInfo: {
              type: 'string',
              example: 'Interested in Computer Science programs'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Team: {
          type: 'object',
          required: ['name', 'role', 'image'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439015'
            },
            name: {
              type: 'string',
              example: 'Sarah Johnson'
            },
            role: {
              type: 'string',
              example: 'CEO & Founder'
            },
            image: {
              type: 'string',
              example: 'team/sarah-johnson.jpg'
            },
            displayOrder: {
              type: 'integer',
              example: 1
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Testimonial: {
          type: 'object',
          required: ['name', 'country', 'quote', 'image', 'rating'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439016'
            },
            name: {
              type: 'string',
              example: 'Anita Gurung'
            },
            country: {
              type: 'string',
              example: 'United States'
            },
            quote: {
              type: 'string',
              example: 'EduConnect helped me get into my dream university with full scholarship!'
            },
            image: {
              type: 'string',
              example: 'testimonials/anita-gurung.jpg'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5
            },
            isFeatured: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439017'
            },
            username: {
              type: 'string',
              example: 'johndoe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              example: 'user'
            },
            active: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        AuditLog: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439018'
            },
            action: {
              type: 'string',
              enum: ['DELETE_COMMENT', 'ROLE_CHANGE', 'CONTENT_EDIT'],
              example: 'ROLE_CHANGE'
            },
            targetId: {
              type: 'string',
              example: '507f1f77bcf86cd799439019'
            },
            performedBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439017'
            },
            metadata: {
              type: 'object',
              example: {
                from: 'user',
                to: 'moderator'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Moderation: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439020'
            },
            contentId: {
              type: 'string',
              example: '507f1f77bcf86cd799439021'
            },
            contentType: {
              type: 'string',
              enum: ['comment', 'post'],
              example: 'comment'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'pending'
            },
            reportedBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439022'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        Comment: {
          type: 'object',
          required: ['content', 'blog'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439023'
            },
            content: {
              type: 'string',
              example: 'This is a great blog post!'
            },
            blog: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            parentComment: {
              type: 'string',
              example: '507f1f77bcf86cd799439024'
            },
            replies: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            likes: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isEdited: {
              type: 'boolean',
              example: false
            },
            isSpam: {
              type: 'boolean',
              example: false
            },
            reportedCount: {
              type: 'integer',
              example: 0
            },
            likeCount: {
              type: 'integer',
              example: 5
            },
            replyCount: {
              type: 'integer',
              example: 2
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};