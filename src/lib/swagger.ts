// OpenAPI/Swagger documentation for the Jira Clone API
import { OpenAPIV3 } from 'openapi-types';

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'ProFlow API',
    description: 'A comprehensive Jira-like project management system API',
    version: '1.0.0',
    contact: {
      name: 'ProFlow Support',
      email: 'support@proflow.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://proflow.vercel.app',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user_123' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          avatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN', 'GUEST'],
            example: 'USER',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'name'],
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'proj_123' },
          name: { type: 'string', example: 'Website Redesign' },
          description: { type: 'string', example: 'Complete redesign of the company website' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name'],
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'TICKET-1234' },
          title: { type: 'string', example: 'Fix login button alignment' },
          description: { type: 'string', example: 'The login button is misaligned on mobile devices' },
          status: {
            type: 'string',
            enum: ['To Do', 'In Progress', 'Done'],
            example: 'In Progress',
          },
          priority: {
            type: 'string',
            enum: ['Low', 'Medium', 'High'],
            example: 'High',
          },
          category: { type: 'string', example: 'UI/UX' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', example: 'proj_123' },
          reporterId: { type: 'string', example: 'user_123' },
          assigneeId: { type: 'string', example: 'user_456' },
          reporter: { $ref: '#/components/schemas/User' },
          assignee: { $ref: '#/components/schemas/User' },
          project: { $ref: '#/components/schemas/Project' },
        },
        required: ['id', 'title', 'description', 'status', 'priority', 'projectId', 'reporterId'],
      },
      TicketCreate: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', minLength: 1, maxLength: 2000 },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
          assigneeId: { type: 'string' },
          projectId: { type: 'string' },
          reporterId: { type: 'string' },
          category: { type: 'string', maxLength: 100 },
          status: { type: 'string', default: 'To Do' },
        },
        required: ['title', 'description', 'priority', 'projectId', 'reporterId'],
      },
      TicketUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', minLength: 1, maxLength: 2000 },
          status: { type: 'string', enum: ['To Do', 'In Progress', 'Done'] },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
          assigneeId: { type: 'string' },
          category: { type: 'string', maxLength: 100 },
          projectId: { type: 'string' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {},
          error: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['success'],
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation error' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        required: ['success', 'error'],
      },
    },
  },
  paths: {
    // Tickets endpoints
    '/api/tickets': {
      get: {
        summary: 'Get all tickets',
        description: 'Retrieve a list of all tickets with optional filtering',
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter tickets by project ID',
          },
          {
            name: 'assigneeId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter tickets by assignee ID',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['To Do', 'In Progress', 'Done'] },
            description: 'Filter tickets by status',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Ticket' },
                        },
                        count: { type: 'number' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new ticket',
        description: 'Create a new ticket in the system',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TicketCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ticket created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update tickets',
        description: 'Update multiple tickets (for drag & drop operations)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ticketId: { type: 'string' },
                  updates: { $ref: '#/components/schemas/TicketUpdate' },
                },
                required: ['ticketId', 'updates'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ticket updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // Individual ticket endpoints
    '/api/tickets/{id}': {
      get: {
        summary: 'Get ticket by ID',
        description: 'Retrieve a specific ticket by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Ticket ID',
          },
        ],
        responses: {
          '200': {
            description: 'Ticket found',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '404': {
            description: 'Ticket not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update ticket',
        description: 'Update a specific ticket by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Ticket ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TicketUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Ticket updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete ticket',
        description: 'Delete a specific ticket by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Ticket ID',
          },
        ],
        responses: {
          '200': {
            description: 'Ticket deleted successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '404': {
            description: 'Ticket not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // Users endpoints
    '/api/users': {
      get: {
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                        count: { type: 'number' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create user',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  avatarUrl: { type: 'string' },
                },
                required: ['name', 'email'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // Projects endpoints
    '/api/projects': {
      get: {
        summary: 'Get all projects',
        description: 'Retrieve a list of all projects',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Project' },
                        },
                        count: { type: 'number' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create project',
        description: 'Create a new project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Project' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // Real-time events
    '/api/realtime': {
      get: {
        summary: 'Real-time events',
        description: 'Server-Sent Events endpoint for real-time updates',
        parameters: [
          {
            name: 'lastEventId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Last event ID for reconnection',
          },
        ],
        responses: {
          '200': {
            description: 'Server-Sent Events stream',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'Event stream with real-time updates',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      sessionAuth: [],
    },
  ],
  tags: [
    {
      name: 'tickets',
      description: 'Ticket management operations',
    },
    {
      name: 'users',
      description: 'User management operations',
    },
    {
      name: 'projects',
      description: 'Project management operations',
    },
    {
      name: 'realtime',
      description: 'Real-time event streaming',
    },
  ],
};