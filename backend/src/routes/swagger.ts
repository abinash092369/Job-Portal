import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const router = Router();

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Job Board API Documentation',
    version: '1.0.0',
    description: 'Production-grade Job Board SaaS API specification. Built with Node.js, Express, TypeScript, and clean code separation.',
  },
  servers: [
    {
      url: 'https://job-portal-production-d544.up.railway.app/api/v1',
      description: 'Production server',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'API Health Check',
        description: 'Verify system status, process uptime, and server timestamp.',
        tags: ['System'],
        responses: {
          200: {
            description: 'System is running smoothly.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        uptime: { type: 'integer', example: 125 },
                        timestamp: { type: 'string', example: '2026-08-02T17:15:32.483Z' }
                      }
                    },
                    message: { type: 'string', example: 'System is running smoothly.' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/profile': {
      get: {
        summary: "Get current user's profile",
        description: 'Returns candidate or employer profile based on the authenticated user\'s role.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['Profile'],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      oneOf: [
                        { $ref: '#/components/schemas/CandidateProfile' },
                        { $ref: '#/components/schemas/EmployerProfile' },
                      ],
                    },
                    message: { type: 'string', example: 'Candidate profile retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized - token missing, expired or invalid',
          },
          403: {
            description: 'Forbidden - User role does not support profiles',
          },
        },
      },
      put: {
        summary: 'Update current user\'s profile',
        description: 'Updates candidate or employer profile fields depending on the user\'s role.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/UpdateCandidateProfileRequest' },
                  { $ref: '#/components/schemas/UpdateEmployerProfileRequest' },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      oneOf: [
                        { $ref: '#/components/schemas/CandidateProfile' },
                        { $ref: '#/components/schemas/EmployerProfile' },
                      ],
                    },
                    message: { type: 'string', example: 'Candidate profile updated successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/profile/resume': {
      post: {
        summary: 'Upload resume (Candidate only)',
        description: 'Uploads or replaces the resume of the authenticated candidate. Max 5MB, PDF/DOC/DOCX.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  resume: {
                    type: 'string',
                    format: 'binary',
                    description: 'Resume file (PDF, DOC, DOCX)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resume uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CandidateProfile' },
                    message: { type: 'string', example: 'Resume uploaded successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request - invalid file type or size (>5MB)',
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - Candidate role only',
          },
        },
      },
    },
    '/profile/photo': {
      post: {
        summary: 'Upload profile photo (Candidate only)',
        description: 'Uploads or replaces the profile photo of the authenticated candidate. Max 5MB, PNG/JPG/JPEG.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Photo file (PNG, JPG, JPEG)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile photo uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CandidateProfile' },
                    message: { type: 'string', example: 'Profile photo uploaded successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request - invalid file type or size (>5MB)',
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - Candidate role only',
          },
        },
      },
    },
    '/profile/logo': {
      post: {
        summary: 'Upload company logo (Employer only)',
        description: 'Uploads or replaces the company logo of the authenticated employer. Max 5MB, PNG/JPG/JPEG.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  logo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Logo file (PNG, JPG, JPEG)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Company logo uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EmployerProfile' },
                    message: { type: 'string', example: 'Company logo uploaded successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad Request - invalid file type or size (>5MB)',
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - Employer role only',
          },
        },
      },
    },
    '/jobs': {
      get: {
        summary: 'List active job postings',
        description: 'Returns a public list of all job postings that currently have status "active". Supports full-text search, filters, pagination, and sorting.',
        tags: ['Jobs'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Number of items per page' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filter by location' },
          { name: 'jobType', in: 'query', schema: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'remote'] }, description: 'Filter by job type' },
          { name: 'salaryMin', in: 'query', schema: { type: 'integer' }, description: 'Filter by minimum salary value (extracted from range)' },
          { name: 'experienceLevel', in: 'query', schema: { type: 'string' }, description: 'Filter by experience level' },
          { name: 'skills', in: 'query', schema: { type: 'string' }, description: 'Filter by skills (comma-separated or multiple parameters)' },
          { name: 'remote', in: 'query', schema: { type: 'boolean' }, description: 'Filter specifically for remote opportunities' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Full-text keyword search query on title/description' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'salary-high', 'salary-low', 'relevance'], default: 'newest' }, description: 'Sorting order' },
        ],
        responses: {
          200: {
            description: 'Active job postings retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        jobs: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Job' },
                        },
                        total: { type: 'integer', example: 12 },
                      },
                    },
                    message: { type: 'string', example: 'Active job postings retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create job posting (Employer only)',
        description: 'Creates a new job posting for the authenticated employer.',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateJobRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Job posting created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting created successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation or request error',
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - Employer only',
          },
        },
      },
    },
    '/jobs/my-jobs': {
      get: {
        summary: "List employer's own job postings (Employer only)",
        description: 'Returns all job postings created by the authenticated employer (including drafts and closed jobs).',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        responses: {
          200: {
            description: 'Job postings retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Job' },
                    },
                    message: { type: 'string', example: 'Your job postings retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - Employer only',
          },
        },
      },
    },
    '/jobs/expire-check': {
      post: {
        summary: 'Trigger job auto-expiration (Employer/Admin)',
        description: 'Scans all active job postings and closes those whose application deadline has passed.',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        responses: {
          200: {
            description: 'Check completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        expiredCount: { type: 'integer', example: 3 },
                      },
                    },
                    message: { type: 'string', example: 'Job auto-expiration check completed' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden',
          },
        },
      },
    },
    '/jobs/{id}': {
      get: {
        summary: 'Get job posting by ID',
        description: 'Returns job posting details for the specified job ID.',
        tags: ['Jobs'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job posting UUID',
          },
        ],
        responses: {
          200: {
            description: 'Job posting retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          404: {
            description: 'Job posting not found',
          },
        },
      },
      put: {
        summary: 'Update job posting details (Employer ownership required)',
        description: 'Updates specified fields of the job posting. Restricts modification of employerId and id.',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job posting UUID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateJobRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Job posting updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting updated successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation or request error',
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - not job owner or not employer',
          },
          404: {
            description: 'Job posting not found',
          },
        },
      },
      delete: {
        summary: 'Delete job posting (Employer ownership required)',
        description: 'Deletes the specified job posting.',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job posting UUID',
          },
        ],
        responses: {
          200: {
            description: 'Job posting deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Job posting deleted successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden - not job owner or not employer',
          },
          404: {
            description: 'Job posting not found',
          },
        },
      },
    },
    '/jobs/{id}/publish': {
      patch: {
        summary: 'Publish job posting (Employer ownership required)',
        description: 'Sets the job posting status to "active".',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job posting UUID',
          },
        ],
        responses: {
          200: {
            description: 'Job posting published successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting published successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden',
          },
          404: {
            description: 'Job posting not found',
          },
        },
      },
    },
    '/jobs/{id}/unpublish': {
      patch: {
        summary: 'Unpublish job posting (Employer ownership required)',
        description: 'Reverts the job posting status to "draft".',
        security: [{ bearerAuth: [] }],
        tags: ['Jobs'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Job posting UUID',
          },
        ],
        responses: {
          200: {
            description: 'Job posting unpublished successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting unpublished successfully' },
                    error: { type: 'object', nullable: true, example: null },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          403: {
            description: 'Forbidden',
          },
          404: {
            description: 'Job posting not found',
          },
        },
      },
    },
    '/jobs/{jobId}/apply': {
      post: {
        summary: 'Apply to a job posting (Candidate only)',
        description: 'Candidate submits an application. Can upload a new resume file (resume) or reuse the resume from their candidate profile.',
        security: [{ bearerAuth: [] }],
        tags: ['Applications'],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job posting UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['coverLetter'],
                properties: {
                  resume: { type: 'string', format: 'binary', description: 'New resume file (PDF, DOC, DOCX)' },
                  coverLetter: { type: 'string', example: 'I am highly interested in this role...' },
                  screeningAnswers: { type: 'string', description: 'JSON stringified array of screening questions answers: [{"question": "...", "answer": "..."}]', example: '[]' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Application submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                    message: { type: 'string', example: 'Application submitted successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          400: { description: 'Bad Request - missing resume, invalid files, or incomplete screening answers' },
          409: { description: 'Conflict - Duplicate application' }
        }
      }
    },
    '/jobs/{jobId}/applications': {
      get: {
        summary: 'List applicants for a job posting (Employer owner only)',
        description: 'Returns all applications submitted for the specified job posting.',
        security: [{ bearerAuth: [] }],
        tags: ['Applications'],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job posting UUID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'] }, description: 'Filter applicants by application status' }
        ],
        responses: {
          200: {
            description: 'Applications retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
                    message: { type: 'string', example: 'Applications retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          403: { description: 'Forbidden - Not job posting creator' }
        }
      }
    },
    '/applications/{id}/status': {
      patch: {
        summary: 'Update application status (Employer owner only)',
        description: 'Changes candidate application status and triggers email notification stub.',
        security: [{ bearerAuth: [] }],
        tags: ['Applications'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Application UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateApplicationStatusRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Application status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                    message: { type: 'string', example: 'Application status updated successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          403: { description: 'Forbidden - Not job posting owner' }
        }
      }
    },
    '/applications/{id}/notes': {
      post: {
        summary: 'Add private note to candidate application (Employer owner only)',
        description: 'Appends private feedback notes for internal evaluation.',
        security: [{ bearerAuth: [] }],
        tags: ['Applications'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Application UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddPrivateNoteRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Private note added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                    message: { type: 'string', example: 'Private note added successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          403: { description: 'Forbidden - Not job posting owner' }
        }
      }
    },
    '/dashboard/employer': {
      get: {
        summary: 'Get employer dashboard statistics',
        description: 'Aggregates total active postings, applicant counts, applicant stats per job, and recent applicant activities.',
        security: [{ bearerAuth: [] }],
        tags: ['Dashboard'],
        responses: {
          200: {
            description: 'Employer dashboard aggregated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EmployerDashboard' },
                    message: { type: 'string', example: 'Employer dashboard retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dashboard/candidate': {
      get: {
        summary: 'Get candidate dashboard statistics',
        description: 'Aggregates applied postings with their status logs, bookmarked jobs lists, and calculates profile completeness percentage.',
        security: [{ bearerAuth: [] }],
        tags: ['Dashboard'],
        responses: {
          200: {
            description: 'Candidate dashboard aggregated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CandidateDashboard' },
                    message: { type: 'string', example: 'Candidate dashboard retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/jobs/saved': {
      get: {
        summary: 'List candidate bookmarked jobs (Candidate only)',
        description: 'Retrieves the candidate\'s list of saved job postings.',
        security: [{ bearerAuth: [] }],
        tags: ['Bookmarks'],
        responses: {
          200: {
            description: 'Saved jobs list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Job' } },
                    message: { type: 'string', example: 'Saved job postings retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/jobs/{jobId}/save': {
      post: {
        summary: 'Bookmark a job posting (Candidate only)',
        description: 'Saves the specified job posting to the candidate\'s saved jobs list.',
        security: [{ bearerAuth: [] }],
        tags: ['Bookmarks'],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job posting UUID' }
        ],
        responses: {
          200: {
            description: 'Job posting saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { saved: { type: 'boolean', example: true } } },
                    message: { type: 'string', example: 'Job posting saved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/jobs/{jobId}/unsave': {
      post: {
        summary: 'Remove a bookmark (Candidate only)',
        description: 'Removes the specified job posting from the candidate\'s saved jobs list.',
        security: [{ bearerAuth: [] }],
        tags: ['Bookmarks'],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string' }, description: 'Job posting UUID' }
        ],
        responses: {
          200: {
            description: 'Job posting unsaved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { saved: { type: 'boolean', example: false } } },
                    message: { type: 'string', example: 'Job posting unsaved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications': {
      get: {
        summary: 'Get user notifications',
        description: 'Retrieves all in-app notifications for the authenticated user, sorted by newest first.',
        security: [{ bearerAuth: [] }],
        tags: ['Notifications'],
        responses: {
          200: {
            description: 'Notifications retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    message: { type: 'string', example: 'Notifications retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/read-all': {
      patch: {
        summary: 'Mark all notifications as read',
        description: 'Marks all unread in-app notifications for the authenticated user as read.',
        security: [{ bearerAuth: [] }],
        tags: ['Notifications'],
        responses: {
          200: {
            description: 'All notifications marked as read successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'All notifications marked as read successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/{id}/read': {
      patch: {
        summary: 'Mark notification as read',
        description: 'Marks a single in-app notification as read.',
        security: [{ bearerAuth: [] }],
        tags: ['Notifications'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Notification UUID' }
        ],
        responses: {
          200: {
            description: 'Notification marked as read successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Notification' },
                    message: { type: 'string', example: 'Notification marked as read successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          403: { description: 'Forbidden - Notification does not belong to user' },
          404: { description: 'Notification not found' }
        }
      }
    },
    '/admin/users': {
      get: {
        summary: 'List all users (Admin only)',
        description: 'Returns all registered users on the platform without passwords.',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        responses: {
          200: {
            description: 'Users list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'c8c93a02-b2be-449e-b14e-6e834ebfa052' },
                          email: { type: 'string', example: 'user@example.com' },
                          role: { type: 'string', example: 'candidate' },
                          isVerified: { type: 'boolean', example: true },
                          isSuspended: { type: 'boolean', example: false },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    message: { type: 'string', example: 'Users retrieved successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/admin/users/{id}/suspend': {
      patch: {
        summary: 'Suspend or unsuspend a user (Admin only)',
        description: 'Toggles a user\'s suspension state. Suspended users cannot log in.',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isSuspended'],
                properties: {
                  isSuspended: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'User suspension status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'c8c93a02-b2be-449e-b14e-6e834ebfa052' },
                        email: { type: 'string', example: 'user@example.com' },
                        role: { type: 'string', example: 'candidate' },
                        isVerified: { type: 'boolean', example: true },
                        isSuspended: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    },
                    message: { type: 'string', example: 'User successfully suspended' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          404: { description: 'User not found' }
        }
      }
    },
    '/admin/employers/{id}/verify': {
      patch: {
        summary: 'Verify or unverify employer profile (Admin only)',
        description: 'Toggles an employer\'s verified badge flag.',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Employer User UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isVerified'],
                properties: {
                  isVerified: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Employer verification status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Employer status successfully updated to verified' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          404: { description: 'Employer profile not found' }
        }
      }
    },
    '/admin/jobs/{id}/status': {
      patch: {
        summary: 'Moderate job status (Admin only)',
        description: 'Forcefully change the status of any job posting (active, draft, closed).',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Job UUID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['draft', 'active', 'closed'], example: 'active' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Job status moderated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Job' },
                    message: { type: 'string', example: 'Job posting status successfully moderated' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          404: { description: 'Job posting not found' }
        }
      }
    },
    '/admin/jobs/{id}': {
      delete: {
        summary: 'Moderate job deletion (Admin only)',
        description: 'Permanently deletes any job posting from the platform.',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Job UUID' }
        ],
        responses: {
          200: {
            description: 'Job deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Job posting successfully deleted by admin' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          },
          404: { description: 'Job posting not found' }
        }
      }
    },
    '/admin/stats': {
      get: {
        summary: 'Aggregated platform metrics (Admin only)',
        description: 'Returns total users, jobs, applications, and breakdown count by user role.',
        security: [{ bearerAuth: [] }],
        tags: ['Admin'],
        responses: {
          200: {
            description: 'Stats retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalUsers: { type: 'integer', example: 120 },
                        totalJobs: { type: 'integer', example: 45 },
                        totalApplications: { type: 'integer', example: 180 },
                        breakdownByRole: {
                          type: 'object',
                          properties: {
                            employer: { type: 'integer', example: 35 },
                            candidate: { type: 'integer', example: 83 },
                            admin: { type: 'integer', example: 2 }
                          }
                        }
                      }
                    },
                    message: { type: 'string', example: 'Platform statistics aggregated successfully' },
                    error: { type: 'object', nullable: true, example: null }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      CandidateProfile: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          headline: { type: 'string', example: 'Senior Software Engineer' },
          skills: { type: 'array', items: { type: 'string' }, example: ['TypeScript', 'Node.js', 'React'] },
          experience: {
            type: 'array',
            items: { type: 'object' },
            example: [{ company: 'Google', role: 'SWE II', duration: '2 years' }],
          },
          education: {
            type: 'array',
            items: { type: 'object' },
            example: [{ school: 'Stanford', degree: 'BS CS', year: '2020' }],
          },
          resumeUrl: { type: 'string', example: '/uploads/resumes/resume-1620000000000.pdf' },
          profilePhotoUrl: { type: 'string', example: '/uploads/photos/photo-1620000000000.png' },
          location: { type: 'string', example: 'San Francisco, CA' },
          phone: { type: 'string', example: '+1-555-0199' },
        },
      },
      EmployerProfile: {
        type: 'object',
        properties: {
          companyName: { type: 'string', example: 'Acme Corp' },
          logoUrl: { type: 'string', example: '/uploads/logos/logo-1620000000000.png' },
          description: { type: 'string', example: 'Leading provider of software and consulting solutions.' },
          website: { type: 'string', example: 'https://acme.example.com' },
          industry: { type: 'string', example: 'Technology' },
          companySize: { type: 'string', example: '50-200' },
          isVerified: { type: 'boolean', example: false },
        },
      },
      UpdateCandidateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          headline: { type: 'string', example: 'Senior Software Engineer' },
          skills: { type: 'array', items: { type: 'string' }, example: ['TypeScript', 'Node.js'] },
          experience: { type: 'array', items: { type: 'object' } },
          education: { type: 'array', items: { type: 'object' } },
          location: { type: 'string', example: 'Austin, TX' },
          phone: { type: 'string', example: '+1-555-9876' },
        },
      },
      UpdateEmployerProfileRequest: {
        type: 'object',
        properties: {
          companyName: { type: 'string', example: 'Acme Corp' },
          description: { type: 'string', example: 'Provider of web widgets.' },
          website: { type: 'string', example: 'https://widgets.example.com' },
          industry: { type: 'string', example: 'E-Commerce' },
          companySize: { type: 'string', example: '10-50' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'b3f5451c-799d-4786-8a4c-ecbf54203490' },
          employerId: { type: 'string', example: 'cd1923e1-cc67-47b2-a6f9-03a0dfa8ebcd' },
          title: { type: 'string', example: 'Backend Developer (Node.js)' },
          description: { type: 'string', example: 'We are seeking a strong backend engineer...' },
          responsibilities: { type: 'string', example: 'Build and maintain clean microservices...' },
          requirements: { type: 'string', example: '3+ years experience with Node.js & TypeScript...' },
          skills: { type: 'array', items: { type: 'string' }, example: ['Node.js', 'TypeScript', 'Express'] },
          salaryRange: { type: 'string', example: '$90k - $120k' },
          jobType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'remote'], example: 'full-time' },
          location: { type: 'string', example: 'New York, NY' },
          experienceLevel: { type: 'string', example: 'Mid-Senior' },
          applicationDeadline: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59.000Z' },
          status: { type: 'string', enum: ['draft', 'active', 'closed'], example: 'draft' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateJobRequest: {
        type: 'object',
        required: [
          'title',
          'description',
          'responsibilities',
          'requirements',
          'skills',
          'salaryRange',
          'jobType',
          'location',
          'experienceLevel',
          'applicationDeadline',
        ],
        properties: {
          title: { type: 'string', example: 'Backend Developer (Node.js)' },
          description: { type: 'string', example: 'We are seeking a strong backend engineer...' },
          responsibilities: { type: 'string', example: 'Build and maintain clean microservices...' },
          requirements: { type: 'string', example: '3+ years experience with Node.js & TypeScript...' },
          skills: { type: 'array', items: { type: 'string' }, example: ['Node.js', 'TypeScript'] },
          salaryRange: { type: 'string', example: '$90k - $120k' },
          jobType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'remote'], example: 'full-time' },
          location: { type: 'string', example: 'New York, NY' },
          experienceLevel: { type: 'string', example: 'Mid-Senior' },
          applicationDeadline: { type: 'string', format: 'date-time', example: '2026-12-31T23:59:59.000Z' },
          status: { type: 'string', enum: ['draft', 'active', 'closed'], default: 'draft', example: 'draft' },
        },
      },
      UpdateJobRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Senior Backend Developer (Node.js)' },
          description: { type: 'string' },
          responsibilities: { type: 'string' },
          requirements: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          salaryRange: { type: 'string' },
          jobType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'remote'] },
          location: { type: 'string' },
          experienceLevel: { type: 'string' },
          applicationDeadline: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['draft', 'active', 'closed'] },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'c8c93a02-b2be-449e-b14e-6e834ebfa052' },
          jobId: { type: 'string', example: 'b3f5451c-799d-4786-8a4c-ecbf54203490' },
          candidateId: { type: 'string', example: 'cd1923e1-cc67-47b2-a6f9-03a0dfa8ebcd' },
          resumeUrl: { type: 'string', example: '/uploads/resumes/resume-1620000000000.pdf' },
          coverLetter: { type: 'string', example: 'Cover letter body text...' },
          screeningAnswers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string', example: 'What is your React experience?' },
                answer: { type: 'string', example: 'I have 3 years using React.' }
              }
            }
          },
          status: { type: 'string', enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'], example: 'applied' },
          notes: { type: 'array', items: { type: 'string' }, example: ['Good technical skills', 'Schedule screen call'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdateApplicationStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired'], example: 'reviewed' }
        }
      },
      AddPrivateNoteRequest: {
        type: 'object',
        required: ['note'],
        properties: {
          note: { type: 'string', example: 'Candidate had strong design system experience.' }
        }
      },
      EmployerDashboard: {
        type: 'object',
        properties: {
          activeJobsCount: { type: 'integer', example: 3 },
          totalApplicants: { type: 'integer', example: 12 },
          applicantsPerJob: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                jobId: { type: 'string', example: 'b3f5451c-799d-4786-8a4c-ecbf54203490' },
                jobTitle: { type: 'string', example: 'Backend Developer (Node.js)' },
                applicantCount: { type: 'integer', example: 5 }
              }
            }
          },
          recentActivity: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'c8c93a02-b2be-449e-b14e-6e834ebfa052' },
                jobId: { type: 'string', example: 'b3f5451c-799d-4786-8a4c-ecbf54203490' },
                jobTitle: { type: 'string', example: 'Backend Developer (Node.js)' },
                candidateName: { type: 'string', example: 'Jane Doe' },
                status: { type: 'string', example: 'applied' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      CandidateDashboard: {
        type: 'object',
        properties: {
          appliedJobs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'c8c93a02-b2be-449e-b14e-6e834ebfa052' },
                jobId: { type: 'string', example: 'b3f5451c-799d-4786-8a4c-ecbf54203490' },
                jobTitle: { type: 'string', example: 'Backend Developer (Node.js)' },
                companyName: { type: 'string', example: 'Acme Corp' },
                status: { type: 'string', example: 'applied' },
                appliedAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          savedJobs: {
            type: 'array',
            items: { $ref: '#/components/schemas/Job' }
          },
          profileCompleteness: { type: 'integer', example: 85 }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'd3f5451c-799d-4786-8a4c-ecbf54203490' },
          userId: { type: 'string', example: 'cd1923e1-cc67-47b2-a6f9-03a0dfa8ebcd' },
          type: { type: 'string', enum: ['application_received', 'status_changed', 'job_expiring'], example: 'status_changed' },
          title: { type: 'string', example: 'Application Status Updated' },
          message: { type: 'string', example: 'Your application status for "Backend Developer" has been updated to "interview".' },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
  },
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

export default router;
