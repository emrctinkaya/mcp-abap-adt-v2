# mcp-abap-adt: Your Gateway to ABAP Development Tools (ADT)

[![smithery badge](https://smithery.ai/badge/@mario-andreschak/mcp-abap-adt)](https://smithery.ai/server/@mario-andreschak/mcp-abap-adt)

This project provides a server that allows you to interact with SAP ABAP systems using the Model Context Protocol (MCP). Think of it as a bridge that lets tools like [Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) (a VS Code extension) talk to your ABAP system and retrieve information like source code, table structures, and more. It's like having a remote control for your ABAP development environment!

[![ABAP ADT MCP server](https://glama.ai/mcp/servers/gwkh12xlu7/badge)](https://glama.ai/mcp/servers/gwkh12xlu7)

This guide is designed for beginners, so we'll walk through everything step-by-step. We'll cover:

1. **Prerequisites:** What you need before you start.
2. **Installation and Setup:** Getting everything up and running.
3. **Running the Server:** Starting the server in different modes.
4. **Integrating with Cline:** Connecting this server to the Cline VS Code extension.
5. **Troubleshooting:** Common problems and solutions.
6. **Available Tools:** A list of the commands you can use.

## 1. Prerequisites

Before you begin, you'll need a few things:

* **An SAP ABAP System:** This server connects to an existing ABAP system. You'll need:

  + The system's URL (e.g., `https://my-sap-system.com:8000`)
  + A valid username and password for that system.
  + The SAP client number (e.g., `100`).
  + Ensure that your SAP system allows connections via ADT (ABAP Development Tools). This usually involves making sure the necessary services are activated in transaction `SICF`. Your basis administrator can help with this. Specifically, you will need the following services to be active:
    - `/sap/bc/adt`
  + For the `GetTableContents` Tool, you will need the implementation of a custom service `/z_mcp_abap_adt/z_tablecontent`. You can follow this guide [here](https://community.sap.com/t5/application-development-blog-posts/how-to-use-rfc-read-table-from-javascript-via-webservice/ba-p/13172358)

* **Git (or GitHub Desktop):** We'll use Git to download the project code. You have two options:

  + **Git:** The command-line tool. [Download Git](https://git-scm.com/downloads). Choose the version for your operating system (Windows, macOS, Linux). Follow the installation instructions.
  + **GitHub Desktop:** A graphical user interface for Git. Easier for beginners! [Download GitHub Desktop](https://desktop.github.com/). Follow the installation instructions.

* **Node.js and npm:** Node.js is a JavaScript runtime that lets you run JavaScript code outside of a web browser. npm (Node Package Manager) is included with Node.js and is used to install packages (libraries of code).

  + [Download Node.js](https://nodejs.org/en/download/). **Choose the LTS (Long Term Support) version.** This is the most stable version. Follow the installation instructions for your operating system. Make sure to include npm in the installation (it's usually included by default).
  + **Verify Installation:** After installing Node.js, open a new terminal (command prompt on Windows, Terminal on macOS/Linux) and type:

    ```bash
    node -v
    npm -v
    ```

    You should see version numbers for both Node.js and npm. If you see an error, Node.js might not be installed correctly, or it might not be in your system's PATH. (See Troubleshooting below).

## 2. Installation and Setup

Now, let's get the project code and set it up:

### Installing via Smithery

To install MCP ABAP Development Tools Server for Cline automatically via [Smithery](https://smithery.ai/server/@mario-andreschak/mcp-abap-adt):

```bash
npx -y @smithery/cli install @mario-andreschak/mcp-abap-adt --client cline
```

### Manual Installation

1. **Clone the Repository:**

   * **Using Git (command line):**
     1. Open a terminal (command prompt or Terminal).
     2. Navigate to the directory where you want to store the project. For example, to put it on your Desktop:

        ```bash
        cd Desktop
        ```
     3. Clone the repository:

        ```bash
        git clone https://github.com/emrctinkaya/mcp-abap-adt-v2
        ```
     4. Change into the project directory:

        ```bash
        cd mcp-abap-adt-v2
        ```

   * **Using GitHub Desktop:**
     1. Open GitHub Desktop.
     2. Click "File" -> "Clone Repository...".
     3. In the "URL" tab, paste the repository URL.
     4. Choose a local path (where you want to save the project on your computer).
     5. Click "Clone".

2. **Install Dependencies:** This downloads all the necessary libraries the project needs. In the terminal, inside the root directory, run:

   ```bash
   npm install
   ```

   This might take a few minutes.

3. **Build the Project:** This compiles the code into an executable format.

   ```bash
   npm run build
   ```

4. **Create a `.env` file:** This file stores sensitive information like your SAP credentials. It's *very* important to keep this file secure.

   1. In the root directory, create a new file named `.env` (no extension).
   2. Open the `.env` file in a text editor (like Notepad, VS Code, etc.).
   3. Add the following lines, replacing the placeholders with your actual SAP system information:
      Important: If your password contains a "#" character, make sure to enclose your password in quotes!

      ```env
      SAP_URL=https://your-sap-system.com:8000  # Your SAP system URL
      SAP_USERNAME=your_username              # Your SAP username
      SAP_PASSWORD=your_password              # Your SAP password
      SAP_CLIENT=100                         # Your SAP client
      ```

      **Important:** Never share your `.env` file with anyone, and never commit it to a Git repository!

## 3. Running the Server

To be fair, you usually don't usually "run" this server on its own. It is supposed to be integrated into an MCP Client like Cline or Claude Desktop. But you *can* manually run the server in two main ways:

* **Standalone Mode:** This runs the server directly, and it will output messages to the terminal. The server will start and wait for client connections, so potentially rendering it useless except to see if it starts.
* **Development/Debug Mode:** This runs the server with the MCP Inspector. You can open the URL that it outputs in your browser and start playing around.

### 3.1 Standalone Mode

To run the server in standalone mode, use the following command in the terminal (from the root directory):

```bash
npm run start
```

You should see messages in the terminal indicating that the server is running. It will listen for connections from MCP clients. The server will keep running until you stop it (usually with Ctrl+C).

### 3.2 Development/Debug Mode (with Inspector)

This mode is useful for debugging.

1. **Start the server in debug mode:**

   ```bash
   npm run dev
   ```

   This will start the server and output a message like: `🔍 MCP Inspector is up and running at http://localhost:5173 🚀`.
   This is the URL you'll use to open the MCP inspector in your Browser.

## 4. Integrating with Cline

Cline is a VS Code extension that uses MCP servers to provide language support. Here's how to connect this ABAP server to Cline:

1. **Install Cline:** If you haven't already, install the "Cline" extension in VS Code.

2. **Open Cline Settings:**

   * Open the VS Code settings (File -> Preferences -> Settings, or Ctrl+,).
   * Search for "Cline MCP Settings".
   * Click "Edit in settings.json". This will open the `cline_mcp_settings.json` file. The full path is usually something like: `C:\Users\username\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` (replace `username` with your Windows username).

3. **Add the Server Configuration:** You'll need to add an entry to the `servers` array in the `cline_mcp_settings.json` file. Here's an example:

   ```json
   {
     "mcpServers": {
       "mcp-abap-adt": {
         "command": "node",
         "args": [
           "C:/PATH_TO/mcp-abap-adt-v2/dist/index.js"
         ],
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

4. **Test the Connection:**

   * Cline should automatically connect to the server. You will see the Server appear in the "MCP Servers" Panel (in the Cline extension, you'll find different buttons on the top.)
   * Ask Cline to get the Sourcecode of a program and it should mention the MCP Server and should try to use the corresponding tools

## 5. Troubleshooting

* **`node -v` or `npm -v` gives an error:**
  + Make sure Node.js is installed correctly. Try reinstalling it.
  + Ensure that the Node.js installation directory is in your system's PATH environment variable. On Windows, you can edit environment variables through the System Properties (search for "environment variables" in the Start Menu).

* **`npm install` fails:**
  + Make sure you have an internet connection.
  + Try deleting the `node_modules` folder and running `npm install` again.
  + If you're behind a proxy, you might need to configure npm to use the proxy. Search online for "npm proxy settings".

* **Cline doesn't connect to the server:**
  + Double-check the settings in `cline_mcp_settings.json`. It *must* be the correct, absolute path to the `dist/index.js` file, and use forward slashes or double backslashes on Windows.
  + Make sure the server is running (use `npm run start` to check).
  + Restart VS Code.
  + Alternatively:
    + Navigate to the root folder of mcp-abap-adt in your Explorer, Shift+Right-Click and select "Open Powershell here". (Or open a Powershell and navigate to the folder using `cd C:/PATH_TO/mcp-abap-adt-v2/`)
    + Run `npm install`
    + Run `npm run build`
    + Run `npx @modelcontextprotocol/inspector node dist/index.js`
    + Open your browser at the URL it outputs. Click "connect" on the left side.
    + Click "Tools" on the top, then click "List Tools"
    + Click GetProgram and enter "SAPMV45A" or any other Report name as Program Name on the right
    + Test and see what the output is

* **SAP connection errors:**
  + Verify your SAP credentials in the `.env` file.
  + Ensure that the SAP system is running and accessible from your network.
  + Make sure that your SAP user has the necessary authorizations to access the ADT services.
  + Check that the required ADT services are activated in transaction `SICF`.
  + If you're using self-signed certificates or there is an issue with your SAP systems http config, make sure to set TLS_REJECT_UNAUTHORIZED as described above!

## 6. Available Tools

This server provides the following tools, which can be used through Cline (or any other MCP client):

### 📖 Read Operations

| Tool Name | Description | Input Parameters | Example Usage |
| --- | --- | --- | --- |
| `GetProgram` | Retrieve ABAP program source code | `program_name` (string): Name of the ABAP program | `GetProgram program_name=ZMY_PROGRAM` |
| `GetClass` | Retrieve ABAP class source code | `class_name` (string): Name of the ABAP class | `GetClass class_name=ZCL_MY_CLASS` |
| `GetFunctionGroup` | Retrieve ABAP Function Group source code | `function_group` (string): Name of the function group | `GetFunctionGroup function_group=ZMY_FUNCTION_GROUP` |
| `GetFunction` | Retrieve ABAP Function Module source code | `function_name` (string), `function_group` (string) | `GetFunction function_name=ZMY_FUNCTION function_group=ZFG` |
| `GetStructure` | Retrieve ABAP Structure | `structure_name` (string): Name of the DDIC Structure | `GetStructure structure_name=ZMY_STRUCT` |
| `GetTable` | Retrieve ABAP table structure | `table_name` (string): Name of the ABAP DB table | `GetTable table_name=ZMY_TABLE` |
| `GetTableContents` | Retrieve contents of an ABAP table | `table_name` (string), `max_rows` (number, optional, default 100) | `GetTableContents table_name=ZMY_TABLE max_rows=50` |
| `GetPackage` | Retrieve ABAP package details | `package_name` (string): Name of the ABAP package | `GetPackage package_name=ZMY_PACKAGE` |
| `GetTypeInfo` | Retrieve ABAP type information | `type_name` (string): Name of the ABAP type | `GetTypeInfo type_name=ZMY_TYPE` |
| `GetInclude` | Retrieve ABAP include source code | `include_name` (string): Name of the ABAP include | `GetInclude include_name=ZMY_INCLUDE` |
| `SearchObject` | Search for ABAP objects using quick search | `query` (string), `maxResults` (number, optional, default 100) | `SearchObject query=ZMY* maxResults=20` |
| `GetInterface` | Retrieve ABAP interface source code | `interface_name` (string): Name of the ABAP interface | `GetInterface interface_name=ZIF_MY_INTERFACE` |
| `GetTransaction` | Retrieve ABAP transaction details | `transaction_name` (string): Name of the ABAP transaction | `GetTransaction transaction_name=ZMY_TRANSACTION` |

### ✏️ Create Operations

| Tool Name | Description | Input Parameters | Example Usage |
| --- | --- | --- | --- |
| `CreateStructure` | Create a new ABAP DDIC structure | `structure_name`, `description`, `package_name`, `fields[]`, `transport_request` (optional), `enhancement_category` (optional) | See example below |
| `CreateTable` | Create a new ABAP DDIC database table | `table_name`, `description`, `package_name`, `fields[]`, `transport_request` (optional), `table_category`, `delivery_class`, `enhancement_category`, `include_client` | See example below |

#### CreateStructure Example

```json
{
  "structure_name": "ZMY_CUSTOMER_DATA",
  "description": "Customer data structure",
  "package_name": "$TMP",
  "fields": [
    { "name": "CUSTOMER_ID", "type": "abap.numc(10)" },
    { "name": "NAME", "type": "abap.char(40)" },
    { "name": "EMAIL", "type": "abap.char(100)" },
    { "name": "CREATED_AT", "type": "abap.utclong" }
  ],
  "enhancement_category": "NOT_EXTENSIBLE"
}
```

#### CreateTable Example

```json
{
  "table_name": "ZMY_ORDERS",
  "description": "Customer orders table",
  "package_name": "$TMP",
  "fields": [
    { "name": "ORDER_ID", "type": "abap.numc(10)", "isKey": true },
    { "name": "CUSTOMER_ID", "type": "abap.numc(10)" },
    { "name": "ORDER_DATE", "type": "abap.dats" },
    { "name": "TOTAL_AMOUNT", "type": "abap.dec(15,2)" },
    { "name": "STATUS", "type": "abap.char(1)" }
  ],
  "table_category": "TRANSPARENT",
  "delivery_class": "A",
  "include_client": true
}
```

### Common ABAP Field Types

| Type | Description | Example |
| --- | --- | --- |
| `abap.char(n)` | Character field of length n | `abap.char(40)` |
| `abap.numc(n)` | Numeric character field | `abap.numc(10)` |
| `abap.int1` | 1-byte integer (0-255) | `abap.int1` |
| `abap.int2` | 2-byte integer | `abap.int2` |
| `abap.int4` | 4-byte integer | `abap.int4` |
| `abap.int8` | 8-byte integer | `abap.int8` |
| `abap.dec(p,s)` | Packed decimal (precision, scale) | `abap.dec(15,2)` |
| `abap.fltp` | Floating point | `abap.fltp` |
| `abap.string` | Variable length string | `abap.string` |
| `abap.rawstring` | Raw string (binary) | `abap.rawstring` |
| `abap.dats` | Date (YYYYMMDD) | `abap.dats` |
| `abap.tims` | Time (HHMMSS) | `abap.tims` |
| `abap.utclong` | UTC timestamp | `abap.utclong` |
| `abap.clnt` | Client field | `abap.clnt` |
| `<data_element>` | Reference to existing data element | `matnr`, `kunnr` |

### Delivery Class Reference (for CreateTable)

| Class | Description |
| --- | --- |
| `A` | Application table (master and transaction data) |
| `C` | Customizing table (customer data only) |
| `L` | Temporary data (deleted during upgrade) |
| `G` | Customer table (protected from SAP updates) |
| `E` | System table with own namespace |
| `S` | System table (SAP changes only) |
| `W` | System table (transferred via own TR) |

## 7. Changelog

### Version 0.2.0
- ✨ **NEW:** Added `CreateStructure` tool for creating DDIC structures
- ✨ **NEW:** Added `CreateTable` tool for creating DDIC database tables
- 📝 Updated documentation with examples and field type reference

### Version 0.1.0
- Initial release with read-only tools

## 8. Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 9. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 10. Acknowledgments

- Original project by [mario-andreschak](https://github.com/mario-andreschak/mcp-abap-adt)
- SAP ADT REST API documentation
- Model Context Protocol (MCP) by Anthropic
