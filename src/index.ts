#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import dotenv from 'dotenv';

// Import handler functions - READ operations
import { handleGetProgram } from './handlers/handleGetProgram';
import { handleGetClass } from './handlers/handleGetClass';
import { handleGetFunctionGroup } from './handlers/handleGetFunctionGroup';
import { handleGetFunction } from './handlers/handleGetFunction';
import { handleGetTable } from './handlers/handleGetTable';
import { handleGetStructure } from './handlers/handleGetStructure';
import { handleGetTableContents } from './handlers/handleGetTableContents';
import { handleGetPackage } from './handlers/handleGetPackage';
import { handleGetInclude } from './handlers/handleGetInclude';
import { handleGetTypeInfo } from './handlers/handleGetTypeInfo';
import { handleGetInterface } from './handlers/handleGetInterface';
import { handleGetTransaction } from './handlers/handleGetTransaction';
import { handleSearchObject } from './handlers/handleSearchObject';

// Import handler functions - CREATE operations
import { handleCreateStructure } from './handlers/handleCreateStructure';
import { handleCreateTable } from './handlers/handleCreateTable';

// Import shared utility functions and types
import { getBaseUrl, getAuthHeaders, createAxiosInstance, makeAdtRequest, return_error, return_response } from './lib/utils';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Interface for SAP configuration
export interface SapConfig {
  url: string;
  username: string;
  password: string;
  client: string;
}

/**
 * Retrieves SAP configuration from environment variables.
 *
 * @returns {SapConfig} The SAP configuration object.
 * @throws {Error} If any required environment variable is missing.
 */
export function getConfig(): SapConfig {
  const url = process.env.SAP_URL;
  const username = process.env.SAP_USERNAME;
  const password = process.env.SAP_PASSWORD;
  const client = process.env.SAP_CLIENT;

  // Check if all required environment variables are set
  if (!url || !username || !password || !client) {
    throw new Error(`Missing required environment variables. Required variables:
- SAP_URL
- SAP_USERNAME
- SAP_PASSWORD
- SAP_CLIENT`);
  }

  return { url, username, password, client };
}

/**
 * Server class for interacting with ABAP systems via ADT.
 */
export class mcp_abap_adt_server {
  private server: Server;  // Instance of the MCP server
  private sapConfig: SapConfig; // SAP configuration

  /**
   * Constructor for the mcp_abap_adt_server class.
   */
  constructor() {
    this.sapConfig = getConfig(); // Load SAP configuration
    this.server = new Server(  // Initialize the MCP server
      {
        name: 'mcp-abap-adt', // Server name
        version: '0.2.0',       // Server version - bumped for new features
      },
      {
        capabilities: {
          tools: {}, // Initially, no tools are registered
        },
      }
    );

    this.setupHandlers(); // Setup request handlers
  }

  /**
   * Sets up request handlers for listing and calling tools.
   * @private
   */
  private setupHandlers() {
    // Setup tool handlers

    // Handler for ListToolsRequest
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ==================== READ TOOLS ====================
          {
            name: 'GetProgram',
            description: 'Retrieve ABAP program source code',
            inputSchema: {
              type: 'object',
              properties: {
                program_name: {
                  type: 'string',
                  description: 'Name of the ABAP program'
                }
              },
              required: ['program_name']
            }
          },
          {
            name: 'GetClass',
            description: 'Retrieve ABAP class source code',
            inputSchema: {
              type: 'object',
              properties: {
                class_name: {
                  type: 'string',
                  description: 'Name of the ABAP class'
                }
              },
              required: ['class_name']
            }
          },
          {
            name: 'GetFunctionGroup',
            description: 'Retrieve ABAP Function Group source code',
            inputSchema: {
              type: 'object',
              properties: {
                function_group: {
                  type: 'string',
                  description: 'Name of the function module'
                }
              },
              required: ['function_group']
            }
          },
          {
            name: 'GetFunction',
            description: 'Retrieve ABAP Function Module source code',
            inputSchema: {
              type: 'object',
              properties: {
                function_name: {
                  type: 'string',
                  description: 'Name of the function module'
                },
                function_group: {
                  type: 'string',
                  description: 'Name of the function group'
                }
              },
              required: ['function_name', 'function_group']
            }
          },
          {
            name: 'GetStructure',
            description: 'Retrieve ABAP Structure',
            inputSchema: {
              type: 'object',
              properties: {
                structure_name: {
                  type: 'string',
                  description: 'Name of the ABAP Structure'
                }
              },
              required: ['structure_name']
            }
          },
          {
            name: 'GetTable',
            description: 'Retrieve ABAP table structure',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the ABAP table'
                }
              },
              required: ['table_name']
            }
          },
          {
            name: 'GetTableContents',
            description: 'Retrieve contents of an ABAP table',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the ABAP table'
                },
                max_rows: {
                  type: 'number',
                  description: 'Maximum number of rows to retrieve',
                  default: 100
                }
              },
              required: ['table_name']
            }
          },
          {
            name: 'GetPackage',
            description: 'Retrieve ABAP package details',
            inputSchema: {
              type: 'object',
              properties: {
                package_name: {
                  type: 'string',
                  description: 'Name of the ABAP package'
                }
              },
              required: ['package_name']
            }
          },
          {
            name: 'GetTypeInfo',
            description: 'Retrieve ABAP type information',
            inputSchema: {
              type: 'object',
              properties: {
                type_name: {
                  type: 'string',
                  description: 'Name of the ABAP type'
                }
              },
              required: ['type_name']
            }
          },
          {
            name: 'GetInclude',
            description: 'Retrieve ABAP Include Source Code',
            inputSchema: {
              type: 'object',
              properties: {
                include_name: {
                  type: 'string',
                  description: 'Name of the ABAP Include'
                }
              },
              required: ['include_name']
            }
          },
          {
            name: 'SearchObject',
            description: 'Search for ABAP objects using quick search',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query string (use * wildcard for partial match)'
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 100
                }
              },
              required: ['query']
            }
          },
          {
            name: 'GetTransaction',
            description: 'Retrieve ABAP transaction details',
            inputSchema: {
              type: 'object',
              properties: {
                transaction_name: {
                  type: 'string',
                  description: 'Name of the ABAP transaction'
                }
              },
              required: ['transaction_name']
            }
          },
          {
            name: 'GetInterface',
            description: 'Retrieve ABAP interface source code',
            inputSchema: {
              type: 'object',
              properties: {
                interface_name: {
                  type: 'string',
                  description: 'Name of the ABAP interface'
                }
              },
              required: ['interface_name']
            }
          },

          // ==================== CREATE TOOLS ====================
          {
            name: 'CreateStructure',
            description: 'Create a new ABAP DDIC structure in the SAP system',
            inputSchema: {
              type: 'object',
              properties: {
                structure_name: {
                  type: 'string',
                  description: 'Name of the structure (e.g., ZMY_STRUCTURE). Will be converted to uppercase.'
                },
                description: {
                  type: 'string',
                  description: 'Short description of the structure (max 60 characters)'
                },
                package_name: {
                  type: 'string',
                  description: 'ABAP package name (e.g., ZPACKAGE or $TMP for local/temporary objects)'
                },
                transport_request: {
                  type: 'string',
                  description: 'Transport request number (e.g., DEVK900123). Required for non-local packages. Leave empty for $TMP.'
                },
                fields: {
                  type: 'array',
                  description: 'Array of structure fields',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Field name'
                      },
                      type: {
                        type: 'string',
                        description: 'Field type - built-in (abap.char(10), abap.numc(8), abap.string, abap.int4, abap.dats, abap.tims) or data element name'
                      }
                    },
                    required: ['name', 'type']
                  }
                },
                enhancement_category: {
                  type: 'string',
                  enum: ['NOT_EXTENSIBLE', 'EXTENSIBLE_ANY', 'EXTENSIBLE_CHARACTER', 'NOT_CLASSIFIED'],
                  description: 'Enhancement category for the structure (default: NOT_EXTENSIBLE)'
                }
              },
              required: ['structure_name', 'description', 'package_name', 'fields']
            }
          },
          {
            name: 'CreateTable',
            description: 'Create a new ABAP DDIC database table in the SAP system',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the table (e.g., ZMY_TABLE). Will be converted to uppercase.'
                },
                description: {
                  type: 'string',
                  description: 'Short description of the table (max 60 characters)'
                },
                package_name: {
                  type: 'string',
                  description: 'ABAP package name (e.g., ZPACKAGE or $TMP for local/temporary objects)'
                },
                transport_request: {
                  type: 'string',
                  description: 'Transport request number (e.g., DEVK900123). Required for non-local packages. Leave empty for $TMP.'
                },
                fields: {
                  type: 'array',
                  description: 'Array of table fields. At least one field must be marked as key.',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Field name'
                      },
                      type: {
                        type: 'string',
                        description: 'Field type - built-in (abap.char(10), abap.numc(8), abap.string, abap.int4, abap.dats, abap.tims, abap.clnt) or data element name'
                      },
                      isKey: {
                        type: 'boolean',
                        description: 'Whether this field is part of the primary key (default: false)'
                      },
                      notNull: {
                        type: 'boolean',
                        description: 'Whether this field cannot be null (automatically true for key fields)'
                      }
                    },
                    required: ['name', 'type']
                  }
                },
                table_category: {
                  type: 'string',
                  enum: ['TRANSPARENT', 'CLUSTER', 'POOLED', 'GLOBAL_TEMPORARY'],
                  description: 'Table category (default: TRANSPARENT)'
                },
                delivery_class: {
                  type: 'string',
                  enum: ['A', 'C', 'L', 'G', 'E', 'S', 'W'],
                  description: 'Delivery class: A=Application, C=Customizing, L=Temporary, G=Customer, E=System, S=System, W=System (default: A)'
                },
                data_maintenance: {
                  type: 'string',
                  enum: ['RESTRICTED', 'ALLOWED', 'NOT_ALLOWED'],
                  description: 'Data maintenance settings (default: RESTRICTED)'
                },
                enhancement_category: {
                  type: 'string',
                  enum: ['NOT_EXTENSIBLE', 'EXTENSIBLE_ANY', 'EXTENSIBLE_CHARACTER', 'NOT_CLASSIFIED'],
                  description: 'Enhancement category for the table (default: NOT_EXTENSIBLE)'
                },
                include_client: {
                  type: 'boolean',
                  description: 'Whether to include MANDT/CLIENT field as first key field (default: true)'
                }
              },
              required: ['table_name', 'description', 'package_name', 'fields']
            }
          }
        ]
      };
    });

    // Handler for CallToolRequest
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        // ==================== READ OPERATIONS ====================
        case 'GetProgram':
          return await handleGetProgram(request.params.arguments);
        case 'GetClass':
          return await handleGetClass(request.params.arguments);
        case 'GetFunction':
          return await handleGetFunction(request.params.arguments);
        case 'GetFunctionGroup':
          return await handleGetFunctionGroup(request.params.arguments);
        case 'GetStructure':
          return await handleGetStructure(request.params.arguments);
        case 'GetTable':
          return await handleGetTable(request.params.arguments);
        case 'GetTableContents':
          return await handleGetTableContents(request.params.arguments);
        case 'GetPackage':
          return await handleGetPackage(request.params.arguments);
        case 'GetTypeInfo':
          return await handleGetTypeInfo(request.params.arguments);
        case 'GetInclude':
          return await handleGetInclude(request.params.arguments);
        case 'SearchObject':
          return await handleSearchObject(request.params.arguments);
        case 'GetInterface':
          return await handleGetInterface(request.params.arguments);
        case 'GetTransaction':
          return await handleGetTransaction(request.params.arguments);

        // ==================== CREATE OPERATIONS ====================
        case 'CreateStructure':
          return await handleCreateStructure(request.params.arguments);
        case 'CreateTable':
          return await handleCreateTable(request.params.arguments);

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });

    // Handle server shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Starts the MCP server and connects it to the transport.
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Create and run the server
const server = new mcp_abap_adt_server();
server.run().catch((error) => {
  process.exit(1);
});
