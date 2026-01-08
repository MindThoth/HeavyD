/**
 * ============================================================================
 * HEAVY D PRINT & DESIGN - UNIFIED API
 * ============================================================================
 * 
 * Professional single-deployment architecture with internal routing.
 * 
 * This script handles ALL external requests:
 * - Website form submissions
 * - Dashboard API requests  
 * - Admin panel API requests
 * 
 * Deployment: One Web App deployment for everything
 * Architecture: Router pattern with modular handlers
 * 
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Spreadsheet
  SPREADSHEET_ID: 'YOUR_MASTER_SPREADSHEET_ID_HERE',
  MASTER_SHEET: 'Master',
  COMMENTS_SHEET: 'Comments',
  QUOTE_SHEET: 'Quote',
  
  // Drive
  MASTER_FOLDER_NAME: 'Heavy D Master',
  RECEIPT_ROOT_FOLDER_ID: 'YOUR_RECEIPTS_FOLDER_ID_HERE',
  
  // Business
  BUSINESS_NAME: 'Heavy D Print & Design',
  NOTIFICATION_EMAIL: 'info@heavydetailing.com',
  
  // Security (optional - for production)
  ENABLE_AUTH: false, // Set to true to require API keys
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'https://your-website.vercel.app',
    'https://your-admin.vercel.app', 
    'https://your-dashboard.vercel.app'
  ]
};

// ============================================================================
// MAIN ENTRY POINTS - Router Pattern
// ============================================================================

/**
 * Handles GET requests - Routes to appropriate handler
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'health';
    
    Logger.log('GET Request - Action: ' + action);
    
    // Route based on action parameter
    switch(action) {
      case 'health':
        return createResponse({ status: 'ok', message: 'Heavy D API is running' });
      
      // Dashboard actions
      case 'login':
        return handleDashboardLogin(e);
      case 'getClientData':
        return handleGetClientData(e);
      case 'getAllClients':
        return handleGetAllClients(e);
      
      default:
        return createResponse({ error: 'Unknown action: ' + action }, 400);
    }
    
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handles POST requests - Routes to appropriate handler
 */
function doPost(e) {
  try {
    // Parse request data
    const requestData = parseRequestData(e);
    const action = requestData.action || 'form-submission';
    
    Logger.log('POST Request - Action: ' + action);
    
    // Route based on action
    switch(action) {
      // Website form submission
      case 'form-submission':
      case 'submit-form':
        return handleFormSubmission(requestData);
      
      // Dashboard actions
      case 'addComment':
        return handleAddComment(requestData);
      case 'uploadFile':
        return handleFileUpload(requestData);
      case 'acceptQuote':
        return handleAcceptQuote(requestData);
      
      // Admin actions
      case 'updateClientData':
        return handleUpdateClientData(requestData);
      case 'deleteClient':
        return handleDeleteClient(requestData);
      
      default:
        return createResponse({ error: 'Unknown action: ' + action }, 400);
    }
    
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse incoming request data from GET or POST
 */
function parseRequestData(e) {
  try {
    // Try to parse POST body as JSON
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    
    // Fall back to URL parameters
    return e.parameter || {};
    
  } catch (error) {
    Logger.log('Parse error: ' + error.toString());
    return e.parameter || {};
  }
}

/**
 * Create standardized JSON response with CORS headers
 */
function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers for all allowed origins
  // Note: In production, you'd check the origin and only allow specific ones
  return output;
}

/**
 * Check if request is authenticated (optional security layer)
 */
function isAuthenticated(requestData) {
  if (!CONFIG.ENABLE_AUTH) return true;
  
  const apiKey = requestData.apiKey || requestData.api_key;
  const validKeys = PropertiesService.getScriptProperties().getProperty('API_KEYS');
  
  return validKeys && validKeys.split(',').includes(apiKey);
}

// ============================================================================
// HANDLER: WEBSITE FORM SUBMISSION
// ============================================================================

function handleFormSubmission(data) {
  try {
    Logger.log('Processing form submission');
    
    // Validate required fields
    const required = ['name', 'email', 'service'];
    for (const field of required) {
      if (!data[field]) {
        return createResponse({ 
          success: false, 
          error: `Missing required field: ${field}` 
        }, 400);
      }
    }
    
    // Check for duplicate
    if (isDuplicateSubmission(data.email, data.service)) {
      return createResponse({
        success: false,
        error: 'A submission with this email and service already exists'
      }, 409);
    }
    
    // Create client folder structure in Drive
    const folderStructure = createClientFolderStructure(data);
    
    // Create client brief document
    const briefDocId = createClientBriefDoc(data, folderStructure);
    
    // Add to Google Sheet
    addToSheet(data, folderStructure, briefDocId);
    
    // Send notifications
    sendNotificationEmails(data, folderStructure);
    
    return createResponse({
      success: true,
      message: 'Form submitted successfully',
      clientFolder: folderStructure.clientFolder.getUrl()
    });
    
  } catch (error) {
    Logger.log('Form submission error: ' + error.toString());
    return createResponse({ 
      success: false, 
      error: error.toString() 
    }, 500);
  }
}

// ============================================================================
// HANDLER: DASHBOARD LOGIN
// ============================================================================

function handleDashboardLogin(e) {
  try {
    const email = e.parameter.email;
    
    if (!email) {
      return createResponse({ error: 'Email required' }, 400);
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // Find client by email
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toLowerCase() === email.toLowerCase()) {
        return createResponse({
          success: true,
          client: {
            name: data[i][1],
            email: data[i][2],
            company: data[i][3],
            service: data[i][4]
          }
        });
      }
    }
    
    return createResponse({ 
      success: false, 
      error: 'Client not found' 
    }, 404);
    
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// HANDLER: GET CLIENT DATA
// ============================================================================

function handleGetClientData(e) {
  try {
    const email = e.parameter.email;
    
    if (!email) {
      return createResponse({ error: 'Email required' }, 400);
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const masterSheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    const commentsSheet = ss.getSheetByName(CONFIG.COMMENTS_SHEET);
    
    // Get client data from master sheet
    const masterData = masterSheet.getDataRange().getValues();
    let clientData = null;
    let rowIndex = -1;
    
    for (let i = 1; i < masterData.length; i++) {
      if (masterData[i][2] && masterData[i][2].toLowerCase() === email.toLowerCase()) {
        clientData = {
          name: masterData[i][1],
          email: masterData[i][2],
          company: masterData[i][3],
          service: masterData[i][4],
          phone: masterData[i][5],
          status: masterData[i][6],
          driveFolder: masterData[i][7],
          briefDoc: masterData[i][8],
          quote: masterData[i][9],
          revisions: masterData[i][10] || '',
          submittedAt: masterData[i][11]
        };
        rowIndex = i;
        break;
      }
    }
    
    if (!clientData) {
      return createResponse({ error: 'Client not found' }, 404);
    }
    
    // Get comments
    const commentsData = commentsSheet.getDataRange().getValues();
    const comments = [];
    
    for (let i = 1; i < commentsData.length; i++) {
      if (commentsData[i][1] && commentsData[i][1].toLowerCase() === email.toLowerCase()) {
        comments.push({
          timestamp: commentsData[i][0],
          text: commentsData[i][2],
          author: commentsData[i][3] || 'Client'
        });
      }
    }
    
    return createResponse({
      success: true,
      client: clientData,
      comments: comments
    });
    
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// HANDLER: GET ALL CLIENTS (Admin only)
// ============================================================================

function handleGetAllClients(e) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    const data = sheet.getDataRange().getValues();
    
    const clients = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1]) { // Has name
        clients.push({
          id: i,
          name: data[i][1],
          email: data[i][2],
          company: data[i][3],
          service: data[i][4],
          status: data[i][6],
          submittedAt: data[i][11]
        });
      }
    }
    
    return createResponse({
      success: true,
      clients: clients,
      total: clients.length
    });
    
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// HANDLER: ADD COMMENT
// ============================================================================

function handleAddComment(data) {
  try {
    const { email, comment, author } = data;
    
    if (!email || !comment) {
      return createResponse({ error: 'Email and comment required' }, 400);
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.COMMENTS_SHEET);
    
    sheet.appendRow([
      new Date(),
      email,
      comment,
      author || 'Client'
    ]);
    
    return createResponse({
      success: true,
      message: 'Comment added successfully'
    });
    
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// HANDLER: ACCEPT QUOTE
// ============================================================================

function handleAcceptQuote(data) {
  try {
    const { email } = data;
    
    if (!email) {
      return createResponse({ error: 'Email required' }, 400);
    }
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    const sheetData = sheet.getDataRange().getValues();
    
    // Find client row
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][2] && sheetData[i][2].toLowerCase() === email.toLowerCase()) {
        // Update status to "Quote Accepted"
        sheet.getRange(i + 1, 7).setValue('Quote Accepted');
        
        // Send notification email
        sendQuoteAcceptedNotification(sheetData[i][1], email);
        
        return createResponse({
          success: true,
          message: 'Quote accepted successfully'
        });
      }
    }
    
    return createResponse({ error: 'Client not found' }, 404);
    
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================================================
// HELPER FUNCTIONS - Form Processing
// ============================================================================

function isDuplicateSubmission(email, service) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email && data[i][4] === service) {
      return true;
    }
  }
  return false;
}

function createClientFolderStructure(data) {
  const masterFolder = DriveApp.getFoldersByName(CONFIG.MASTER_FOLDER_NAME).next();
  const clientsFolder = getOrCreateFolder(masterFolder, 'Clients');
  const clientName = cleanFolderName(data.name);
  const companyName = data.company ? cleanFolderName(data.company) : clientName;
  
  const clientFolder = getOrCreateFolder(clientsFolder, clientName);
  const companyFolder = getOrCreateFolder(clientFolder, companyName);
  const serviceFolder = getOrCreateFolder(companyFolder, prettyServiceName(data.service));
  const uploadsFolder = getOrCreateFolder(serviceFolder, 'Uploads');
  const revisionsFolder = getOrCreateFolder(serviceFolder, 'Revisions');
  
  return {
    masterFolder,
    clientsFolder,
    clientFolder,
    companyFolder,
    serviceFolder,
    uploadsFolder,
    revisionsFolder
  };
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function createClientBriefDoc(data, folders) {
  const doc = DocumentApp.create(`${data.name} - ${prettyServiceName(data.service)} Brief`);
  const body = doc.getBody();
  
  body.appendParagraph('CLIENT BRIEF').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('').appendHorizontalRule();
  body.appendParagraph(`Client Name: ${data.name}`);
  body.appendParagraph(`Company: ${data.company || 'N/A'}`);
  body.appendParagraph(`Email: ${data.email}`);
  body.appendParagraph(`Phone: ${data.phone || 'N/A'}`);
  body.appendParagraph(`Service: ${prettyServiceName(data.service)}`);
  body.appendParagraph(`Submitted: ${new Date().toLocaleDateString()}`);
  body.appendParagraph('').appendHorizontalRule();
  body.appendParagraph('PROJECT DETAILS').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(data.message || 'No additional details provided');
  
  const file = DriveApp.getFileById(doc.getId());
  folders.serviceFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  return doc.getId();
}

function addToSheet(data, folders, briefDocId) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const masterSheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
  
  masterSheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.company || '',
    data.service,
    data.phone || '',
    'New Submission',
    folders.serviceFolder.getUrl(),
    DocumentApp.openById(briefDocId).getUrl(),
    '', // Quote link
    '', // Revisions
    new Date().toLocaleDateString()
  ]);
}

function sendNotificationEmails(data, folders) {
  // Admin notification
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: `New ${prettyServiceName(data.service)} Request - ${data.name}`,
    body: `New form submission:\n\nClient: ${data.name}\nEmail: ${data.email}\nService: ${prettyServiceName(data.service)}\n\nFolder: ${folders.serviceFolder.getUrl()}`
  });
  
  // Client confirmation
  MailApp.sendEmail({
    to: data.email,
    subject: `Thank you for contacting ${CONFIG.BUSINESS_NAME}`,
    body: `Hi ${data.name},\n\nThank you for your ${prettyServiceName(data.service)} request. We've received your information and will be in touch shortly.\n\nBest regards,\n${CONFIG.BUSINESS_NAME}`
  });
}

function sendQuoteAcceptedNotification(name, email) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: `Quote Accepted - ${name}`,
    body: `${name} (${email}) has accepted their quote!`
  });
}

// ============================================================================
// UTILITY FUNCTIONS - String Formatting
// ============================================================================

function prettyServiceName(service) {
  const serviceMap = {
    'vehicle-wraps': 'Vehicle Wraps',
    'window-tint': 'Window Tint',
    'paint-protection': 'Paint Protection Film',
    'ceramic-coating': 'Ceramic Coating',
    'detailing': 'Auto Detailing',
    'graphics': 'Custom Graphics',
    'other': 'Other Services'
  };
  return serviceMap[service] || titleCase(service);
}

function cleanFolderName(name) {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
}

function titleCase(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// END OF UNIFIED API
// ============================================================================

