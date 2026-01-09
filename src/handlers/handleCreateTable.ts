/**
 * Handler for creating ABAP DDIC database tables via ADT REST API
 */

import axios from 'axios';
import { getBaseUrl, getAuthHeaders, return_error } from '../lib/utils';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TableField {
  name: string;
  type: string;           // e.g., 'abap.char(10)', 'abap.numc(8)', or data element name
  isKey?: boolean;        // Whether this field is part of the primary key
  notNull?: boolean;      // Whether the field is NOT NULL (required for key fields)
}

export interface CreateTableArgs {
  table_name: string;
  description: string;
  package_name: string;
  transport_request?: string;
  fields: TableField[];
  table_category?: 'TRANSPARENT' | 'CLUSTER' | 'POOLED' | 'GLOBAL_TEMPORARY';
  delivery_class?: 'A' | 'C' | 'L' | 'G' | 'E' | 'S' | 'W';
  data_maintenance?: 'RESTRICTED' | 'ALLOWED' | 'NOT_ALLOWED';
  enhancement_category?: 'NOT_EXTENSIBLE' | 'EXTENSIBLE_ANY' | 'EXTENSIBLE_CHARACTER' | 'NOT_CLASSIFIED';
  include_client?: boolean;  // Whether to include MANDT/CLIENT field (default: true)
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Handles the CreateTable tool request
 */
export async function handleCreateTable(args: any) {
  const {
    table_name,
    description,
    package_name,
    transport_request = '',
    fields,
    table_category = 'TRANSPARENT',
    delivery_class = 'A',
    data_maintenance = 'RESTRICTED',
    enhancement_category = 'NOT_EXTENSIBLE',
    include_client = true
  } = args as CreateTableArgs;

  // Validate inputs
  if (!table_name) {
    return return_error('Table name is required');
  }

  if (!description) {
    return return_error('Description is required');
  }

  if (!package_name) {
    return return_error('Package name is required');
  }

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return return_error('At least one field is required');
  }

  // Validate each field
  for (const field of fields) {
    if (!field.name || !field.type) {
      return return_error('Each field must have a name and type');
    }
  }

  // Check that at least one key field exists (besides client)
  const keyFields = fields.filter(f => f.isKey);
  if (keyFields.length === 0) {
    return return_error('At least one key field is required. Mark fields with isKey: true');
  }

  // Check transport request for non-local packages
  if (package_name.toUpperCase() !== '$TMP' && !transport_request) {
    return return_error('Transport request is required for non-local packages (use $TMP for local objects)');
  }

  const tableNameUpper = table_name.toUpperCase();
  const tableNameLower = table_name.toLowerCase();

  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    // Step 1: Get CSRF token
    const csrfToken = await fetchCsrfToken(baseUrl.toString(), authHeaders);

    // Step 2: Generate source code
    const sourceCode = generateTableSource(
      tableNameLower,
      description,
      fields,
      table_category,
      delivery_class,
      data_maintenance,
      enhancement_category,
      include_client
    );

    // Step 3: Generate metadata XML
    const metadataXml = generateTableMetadataXml(
      tableNameUpper,
      description,
      package_name.toUpperCase()
    );

    // Step 4: Create the table object
    const baseUrlStr = baseUrl.toString();
    const createUrl = `${baseUrlStr}/sap/bc/adt/ddic/tables`;
    const createParams: Record<string, string> = {};

    if (transport_request && package_name.toUpperCase() !== '$TMP') {
      createParams['corrNr'] = transport_request;
    }

    await axios.post(createUrl, metadataXml, {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/vnd.sap.adt.tables.v2+xml',
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/vnd.sap.adt.tables.v2+xml, application/xml'
      },
      params: createParams
    });

    // Step 5: Upload the source code
    const sourceUrl = `${baseUrlStr}/sap/bc/adt/ddic/tables/${tableNameLower}/source/main`;

    await axios.put(sourceUrl, sourceCode, {
      headers: {
        ...authHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-CSRF-Token': csrfToken
      },
      params: createParams
    });

    // Step 6: Activate the table
    await activateObject(baseUrlStr, authHeaders, csrfToken, tableNameLower, tableNameUpper);

    // Return success response
    const successMessage = `✅ Database table ${tableNameUpper} created and activated successfully in package ${package_name.toUpperCase()}

Generated Source Code:
\`\`\`abap
${sourceCode}
\`\`\``;

    return {
      isError: false,
      content: [{
        type: 'text',
        text: successMessage
      }]
    };

  } catch (error: any) {
    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;

      if (status === 401) {
        return return_error('Authentication failed. Check SAP credentials in .env file.');
      }

      if (status === 403) {
        return return_error('Access forbidden. Check user authorizations or CSRF token.');
      }

      if (status === 404) {
        return return_error('ADT endpoint not found. Ensure /sap/bc/adt service is activated in SICF.');
      }

      if (status === 409) {
        return return_error(`Table ${tableNameUpper} already exists.`);
      }

      // Extract error message from response if available
      let errorDetail = '';
      if (typeof responseData === 'string') {
        // Try to extract error message from XML response
        const match = responseData.match(/<message[^>]*>([^<]+)<\/message>/i);
        if (match) {
          errorDetail = match[1];
        } else {
          errorDetail = responseData.substring(0, 500);
        }
      } else if (responseData) {
        errorDetail = JSON.stringify(responseData).substring(0, 500);
      }

      return return_error(`HTTP ${status}: ${errorDetail || error.message}`);
    }

    return return_error(`Failed to create table: ${error.message || 'Unknown error'}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetches a CSRF token from the SAP system
 */
async function fetchCsrfToken(baseUrl: string, authHeaders: any): Promise<string> {
  const response = await axios.get(`${baseUrl}/sap/bc/adt/discovery`, {
    headers: {
      ...authHeaders,
      'X-CSRF-Token': 'Fetch',
      'Accept': 'application/xml'
    }
  });

  const csrfToken = response.headers['x-csrf-token'];
  if (!csrfToken) {
    throw new Error('Failed to obtain CSRF token from SAP system');
  }

  return csrfToken;
}

/**
 * Generates the Dictionary DDL source code for a database table
 */
function generateTableSource(
  tableName: string,
  description: string,
  fields: TableField[],
  tableCategory: string,
  deliveryClass: string,
  dataMaintenance: string,
  enhancementCategory: string,
  includeClient: boolean
): string {
  // Escape single quotes in description
  const escapedDescription = description.replace(/'/g, "''");

  // Build field definitions
  const allFields: string[] = [];

  // Add client field if requested
  if (includeClient) {
    allFields.push('  key client : abap.clnt not null;');
  }

  // Add user-defined fields
  for (const field of fields) {
    const keyPrefix = field.isKey ? 'key ' : '    ';
    const notNullSuffix = (field.isKey || field.notNull) ? ' not null' : '';
    allFields.push(`  ${keyPrefix}${field.name.toLowerCase()} : ${field.type}${notNullSuffix};`);
  }

  const fieldDefinitions = allFields.join('\n');

  return `@EndUserText.label : '${escapedDescription}'
@AbapCatalog.enhancement.category : #${enhancementCategory}
@AbapCatalog.tableCategory : #${tableCategory}
@AbapCatalog.deliveryClass : #${deliveryClass}
@AbapCatalog.dataMaintenance : #${dataMaintenance}
define table ${tableName} {
${fieldDefinitions}
}`;
}

/**
 * Generates the metadata XML for table creation
 */
function generateTableMetadataXml(
  tableName: string,
  description: string,
  packageName: string
): string {
  // Escape XML special characters in description
  const escapedDescription = escapeXml(description);

  // Get username from environment for responsible field
  const responsible = process.env.SAP_USERNAME?.toUpperCase() || 'SAP';

  return `<?xml version="1.0" encoding="UTF-8"?>
<blue:blueSource xmlns:blue="http://www.sap.com/wbobj/blue"
                 xmlns:adtcore="http://www.sap.com/adt/core"
                 adtcore:name="${tableName}"
                 adtcore:description="${escapedDescription}"
                 adtcore:language="EN"
                 adtcore:masterLanguage="EN"
                 adtcore:responsible="${responsible}">
  <adtcore:packageRef adtcore:name="${packageName}"/>
</blue:blueSource>`;
}

/**
 * Activates an ABAP object
 */
async function activateObject(
  baseUrl: string,
  authHeaders: any,
  csrfToken: string,
  tableNameLower: string,
  tableNameUpper: string
): Promise<void> {
  const activateUrl = `${baseUrl}/sap/bc/adt/activation`;

  const activationBody = `<?xml version="1.0" encoding="UTF-8"?>
<adtcore:objectReferences xmlns:adtcore="http://www.sap.com/adt/core">
  <adtcore:objectReference adtcore:uri="/sap/bc/adt/ddic/tables/${tableNameLower}" adtcore:name="${tableNameUpper}"/>
</adtcore:objectReferences>`;

  await axios.post(activateUrl, activationBody, {
    headers: {
      ...authHeaders,
      'Content-Type': 'application/xml',
      'X-CSRF-Token': csrfToken,
      'Accept': 'application/xml'
    },
    params: {
      'method': 'activate',
      'preauditRequested': 'true'
    }
  });
}

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
