/**
 * ============================================================================
 * HEAVY D PRINT & DESIGN - MAIN ROUTER
 * ============================================================================
 * 
 * This is the ONLY file with doPost() and doGet() functions.
 * It routes requests to the appropriate handler in other files.
 * 
 * File Structure:
 * - main.gs (this file) - Handles routing
 * - website.gs - Website form submission logic
 * - dashboard.gs - Dashboard API logic  
 * - adminpanel.gs - Spreadsheet menu functions
 * - revision.gs - Revision update functions
 * 
 * ============================================================================
 */

/**
 * Handle GET requests - Routes based on 'action' and 'api' parameters
 */
function doGet(e) {
  try {
    console.log('=== GET REQUEST ===');
    console.log('Parameters:', JSON.stringify(e.parameter));
    
    // Admin Panel (admin.heavydetailing.com) – same project, route by api=admin
    if (e.parameter.api === 'admin') {
      return handleAdminGet(e);
    }
    
    const action = e.parameter.action || 'health';
    console.log('Action:', action);
    
    // Route to Dashboard handlers (from dashboard.gs)
    if (isDashboardAction(action)) {
      return routeToDashboard_GET(e);
    }
    
    // Default health check
    if (action === 'health') {
      return createJsonResponse({
        status: 'ok',
        message: 'Heavy D API is running',
        timestamp: new Date().toISOString()
      });
    }
    
    // Unknown action
    return createJsonResponse({
      error: 'Unknown action: ' + action,
      availableActions: ['health', 'login', 'getAllClients', 'getClientData']
    }, 400);
    
  } catch (error) {
    console.error('GET Error:', error.toString());
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests - Routes based on 'action' parameter
 */
function doPost(e) {
  const executionId = Utilities.getUuid();
  console.log(`=== POST REQUEST (${executionId}) ===`);
  
  try {
    // Parse request data
    let data;
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        data = e.parameter;
      } else {
        throw new Error("No data received");
      }
    } catch (parseError) {
      console.log('JSON parsing failed, using URL parameters');
      data = e.parameter || {};
    }
    
    const action = data.action || 'form-submission';
    console.log(`Action: ${action}`);
    
    // Admin Panel (admin.heavydetailing.com) – same project, route by api=admin
    if (data.api === 'admin') {
      return handleAdminPost(e);
    }
    
    // Route to Website form handler (from website.gs)
    if (isWebsiteAction(action)) {
      return routeToWebsite_POST(e, data);
    }
    
    // Route to Dashboard handlers (from dashboard.gs)
    if (isDashboardAction(action)) {
      return routeToDashboard_POST(e, data);
    }
    
    // Unknown action
    return createJsonResponse({
      error: 'Unknown action: ' + action,
      availableActions: ['form-submission', 'addComment', 'uploadFile', 'acceptQuote']
    }, 400);
    
  } catch (error) {
    console.error(`POST Error (${executionId}):`, error.toString());
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Check if action belongs to Website
 */
function isWebsiteAction(action) {
  const websiteActions = [
    'form-submission',
    'submit-form',
    'contact-form'
  ];
  
  // If no action specified in a POST, assume it's a form submission
  if (!action || action === '') return true;
  
  return websiteActions.includes(action.toLowerCase());
}

/**
 * Check if action belongs to Dashboard
 */
function isDashboardAction(action) {
  const dashboardActions = [
    'login',
    'getAllClients',
    'getClientData',
    'addComment',
    'uploadFile',
    'acceptQuote',
    'acceptEmail',
    'markRevisionsViewed',
    'getExpenses',
    'getRevenue',
    'listRevisions',
    'getClientByAccessCode',
    'getReceipt',
    'markClientAsPaid'
  ];
  return dashboardActions.includes(action.toLowerCase());
}

/**
 * Route GET request to Dashboard
 * Calls the original doGet from dashboard.gs (now renamed)
 */
function routeToDashboard_GET(e) {
  // Call the dashboard's GET handler (you'll rename it in dashboard.gs)
  return handleDashboardGet(e);
}

/**
 * Route POST request to Dashboard  
 * Calls the original doPost from dashboard.gs (now renamed)
 */
function routeToDashboard_POST(e, data) {
  // Call the dashboard's POST handler (you'll rename it in dashboard.gs)
  return handleDashboardPost(e);
}

/**
 * Route POST request to Website
 * Calls the original doPost from website.gs (now renamed)
 */
function routeToWebsite_POST(e, data) {
  // Call the website's POST handler (you'll rename it in website.gs)
  return handleWebsiteFormSubmission(e);
}

/**
 * Create standardized JSON response
 */
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

