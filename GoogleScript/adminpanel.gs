// HEAVY D ADMIN PANEL - Single script (web app API + spreadsheet menu)
// Deploy as web app: Execute as Me, Who has access: Anyone
const ADMIN_CONFIG = { CLIENTS_SHEET: 'Master', RECEIPT_ROOT_FOLDER_ID: '1ER41h357d3tru7bQ1ulf78COcQ5fojan' };
// Google Apps Script for Heavy D Admin Dashboard
// Version 2.9.4 - Employee management, time entry deletion, receipt lifecycle tracking
// Deploy as web app with "Execute as: Me" and "Who has access: Anyone"

const MASTER_SHEET_ID = '1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU';
const CALCULATOR_SHEET_ID = '1_jLOhyotUzNNmfrzGpH9tRoO06LOsiCFaaRKaSWcjVU';
const EXPENSE_SHEET_ID = '1g_F1nDhv_lLrEWarvRa0gU_0Tulq30AxBL6-o-VbWWg';
const RECEIPTS_TRACKER_SHEET_ID = '1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU';
const TIMESHEET_TEMPLATE_ID = '1-Eu_KkaQIHAW6uzK0npZ-gQgndmDZTj0snBhjxoFKqE';
const YEARLY_RECEIPTS_FOLDER_ID = '1ER41h357d3tru7bQ1ulf78COcQ5fojan'; // Yearly receipts folder
const EMPLOYEE_FOLDER_ID = '1vOBKNQiC1ZCTLmBv1ipsVnJDeeEU3Ieh'; // Employee timesheets folder
const MASTER_SHEET_NAME = 'Master';
const PRICE_SHEET_NAME = 'Price';
const CALCULATOR_SHEET_NAME = 'Calculator';
const EXPENSE_SHEET_NAME = 'Expenses';
const EXPENSE_FOLDER_NAME = 'Expenses';
const RECEIPTS_TRACKER_SHEET_NAME = 'Receipts Tracker';
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // Replace with your OpenAI API key

// Template Document IDs - Get these from your Google Drive folder
// https://drive.google.com/drive/folders/1ppQWgRDjdfpK_Y9D3a-xqu7-fir7jf7A
const QUOTE_TEMPLATE_EN_ID = '1qArSmTeLy6C62KZSWxqM2oGWN-JzkzSFnsgj-HHJ-Vo'; // Replace with English quote template ID
const QUOTE_TEMPLATE_FR_ID = '1ARtgQL2YG5vgMsDqX5a7_zSQy8jTlFWfn_bbYp-6BrY';  // Replace with French quote template ID
const RECEIPT_TEMPLATE_EN_ID = '1LPqKMOwvT4GKjhRJl8A0pNX-tFS7A78TL7ovkDwrZxQ'; // Replace with English receipt template ID
const RECEIPT_TEMPLATE_FR_ID = '1sM3cgM_llLtCaNzxkxxdKBL6GEV1gjdBkXxSwUnE_2o';  // Replace with French receipt template ID

// Admin Panel web app GET handler (called by doGet in Admin Panel project only - see end of file)
function handleAdminGet(e) {
  try {
    var action = e.parameter && e.parameter.action;
    if (action && typeof action === 'object' && action.length !== undefined) action = action[0];
    action = action ? String(action).trim() : '';
    
    if (!action) {
      return createAdminResponse(false, 'No action specified');
    }
    
    Logger.log('Action: ' + action);
    
    switch(action) {
      case 'getAllClients':
        return getAllClients();
      case 'getClient':
        return getClient(e.parameter.code);
      case 'getAllExpenses':
        return getAllExpenses();
      case 'getTimeEntries':
        return getTimeEntries(e.parameter.code);
      case 'addTimeEntry':
        return addTimeEntry(e.parameter);
      case 'getTotalHours':
        return getTotalHours(e.parameter.code);
      case 'createTimesheet':
        return createTimesheet(e.parameter.code, e.parameter.clientName);
      case 'getCalculatorData':
        return getCalculatorData();
      case 'calculateStickerPrice':
        return calculateStickerPrice(e.parameter);
      case 'updateClientStatus':
        return updateClientStatus(e.parameter.accessCode, e.parameter.status);
      case 'updateClientNotes':
        return updateClientNotes(e.parameter.accessCode, e.parameter.notes);
      case 'getBoatName':
        return getBoatName(e.parameter.briefId);
      case 'getBriefContent':
        return getBriefContent(e.parameter.briefId);
      case 'deleteClient':
        return deleteClient(e.parameter.accessCode, e.parameter.driveLink);
      case 'updateClient':
        return updateClient(e.parameter);
      case 'createQuote':
        return createQuote(e.parameter.accessCode);
      case 'createReceipt':
        return createReceipt(e.parameter.accessCode);
      case 'getAllEmployees':
        return getAllEmployees();
      case 'getEmployeeEntries':
        return getEmployeeEntries(e.parameter.employeeName);
      case 'markEmployeeEntryPaid':
        return markEmployeeEntryPaid(e.parameter.employeeName, e.parameter.entryIndex, e.parameter.paid);
      case 'createEmployee':
        return createEmployee(e.parameter);
      case 'getEmployeeInfo':
        return getEmployeeInfo(e.parameter.employeeName);
      case 'updateEmployeeInfo':
        return updateEmployeeInfo(e.parameter);
      case 'deleteEmployeeTimeEntry':
        return deleteEmployeeTimeEntry(e.parameter.employeeName, e.parameter.entryRowIndex, e.parameter.clientCode);
      case 'getAllReceipts':
        return getAllReceipts();
      case 'sendReceiptToFolder':
        return sendReceiptToFolder(e.parameter.accessCode);
      case 'checkReceiptInFolder':
        return checkReceiptInFolder(e.parameter.accessCode);
      default:
        return createAdminResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createAdminResponse(false, 'Server error: ' + error.toString());
  }
}

// Admin Panel web app POST handler (called by doPost in Admin Panel project only - see end of file)
function handleAdminPost(e) {
  try {
    let data = {};

    // Log raw request details for debugging
    Logger.log('POST Request received');
    if (e.postData) {
      Logger.log('Content-Type: ' + (e.postData.type || 'not set'));
      Logger.log('Raw contents: ' + e.postData.contents);
    }

    if (e.postData && e.postData.contents) {
      // Try to parse as JSON first (works for application/json and text/plain with JSON)
      try {
        data = JSON.parse(e.postData.contents);
        Logger.log('Successfully parsed as JSON');
      } catch (jsonError) {
        Logger.log('JSON parse failed, trying URL-encoded: ' + jsonError.toString());
        // If JSON parsing fails, try URL-encoded format
        const pairs = e.postData.contents.split('&');
        for (let pair of pairs) {
          const [key, value] = pair.split('=').map(decodeURIComponent);
          data[key] = value;
        }
      }
    } else if (e.parameter) {
      data = e.parameter;
      Logger.log('Using e.parameter');
    }

    const mode = data.mode || data.action;
    Logger.log('Extracted mode: ' + mode);
    Logger.log('Full data object: ' + JSON.stringify(data));

    let result;
    if (mode === 'upload_image') result = uploadImageToDrive(data);
    else if (mode === 'extract_url') result = extractFromImageUrl(data);
    else if (mode === 'save_expense') result = saveExpenseToSheet(data);
    else if (mode === 'add_client') result = addNewClient(data);
    else {
      Logger.log('Unknown mode received: ' + mode);
      result = ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown mode: ' + mode,
        receivedData: data
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return result;
  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper to create JSON response (named to avoid conflict with dashboard.gs createResponse in same project)
function createAdminResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get all clients from Master sheet
function getAllClients() {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    
    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createAdminResponse(true, 'No clients', { clients: [] });
    }
    // Force read through column X (24 cols) so Boat Name is always included
    var numCols = Math.max(24, sheet.getLastColumn());
    var data = sheet.getRange(1, 1, lastRow, numCols).getValues();
    var clients = [];
    var headers = (data[0] || []).map(function(h) { return String(h || '').toLowerCase().trim(); });
    
    // Resolve column index for "Boat Name" from header (column X = index 23)
    var boatNameCol = 23;
    for (var c = 0; c < headers.length; c++) {
      if (headers[c].indexOf('boat') !== -1) {
        boatNameCol = c;
        break;
      }
    }
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[3]) continue;
      
      var boatNameVal = '';
      if (row[boatNameCol] != null && row[boatNameCol] !== '') {
        boatNameVal = String(row[boatNameCol]).trim();
      }
      
      var client = {
        date: row[0] || '',
        status: row[1] || '',
        priority: row[2] || '',
        name: row[3] || '',
        company: row[4] || '',
        email: row[5] || '',
        phone: row[6] || '',
        language: row[7] || '',
        service: row[8] || '',
        cost: row[9] || '',
        price: row[10] || '',
        driveLink: row[11] || '',
        briefLink: row[12] || '',
        estimateLink: row[13] ? 'https://docs.google.com/spreadsheets/d/' + row[13] : '',
        revisionLink: row[14] || '',
        revisionCode: row[15] || '',
        uploadLink: row[16] || '',
        quoteLink: row[17] || '',
        receiptLink: row[18] || '',
        notes: row[19] || '',
        timeAmount: row[20] || '',
        timesheetLink: row[22] || '',
        boatName: boatNameVal,
        accessCode: row[15] || String(i),
        rowIndex: i
      };
      
      clients.push(client);
    }
    
    return createAdminResponse(true, 'Clients loaded successfully', { clients });
  } catch (error) {
    Logger.log('Error in getAllClients: ' + error.toString());
    return createAdminResponse(false, 'Error loading clients: ' + error.toString());
  }
}

// Get single client by code (checks column P - revisionCode)
function getClient(code) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    
    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Check if revision code (column P, index 15) matches
      if (row[15] == code) {
        const client = {
          date: row[0] || '',
          status: row[1] || '',
          priority: row[2] || '',
          name: row[3] || '',
          company: row[4] || '',
          email: row[5] || '',
          phone: row[6] || '',
          language: row[7] || '',
          service: row[8] || '',
          cost: row[9] || '',
          price: row[10] || '',
          driveLink: row[11] || '',
          briefLink: row[12] || '',                // Column M - Full URL (e.g., https://docs.google.com/open?id=...)
          estimateLink: row[13] ? 'https://docs.google.com/spreadsheets/d/' + row[13] : '', // Column N - Construct full URL from ID
          revisionLink: row[14] || '',         // Column O (index 14) - Revision Link
          revisionCode: row[15] || '',         // Column P (index 15) - Client Code
          uploadLink: row[16] || '',           // Column Q
          quoteLink: row[17] || '',            // Column R
          receiptLink: row[18] || '',          // Column S
          notes: row[19] || '',                // Column T
          timeAmount: row[20] || '',           // Column U
          timesheetLink: row[22] || '',        // Column W (index 22) - Timesheet URL
          boatName: row[23] || '',             // Column X (index 23) - Boat name
          accessCode: row[15] || String(i),    // Column P (index 15)
          rowIndex: i
        };

        return createAdminResponse(true, 'Client found', { client });
      }
    }
    
    return createAdminResponse(false, 'Client not found');
  } catch (error) {
    Logger.log('Error in getClient: ' + error.toString());
    return createAdminResponse(false, 'Error loading client: ' + error.toString());
  }
}

// Update client status
function updateClientStatus(accessCode, status) {
  try {
    if (!accessCode || !status) {
      return createAdminResponse(false, 'Access code and status are required');
    }

    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const data = sheet.getDataRange().getValues();

    // Find the client by access code (column P, index 15)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        const oldStatus = data[i][1]; // Previous status
        const clientName = data[i][3] || 'Client'; // Column D
        const companyName = data[i][4] || ''; // Column E
        const receiptLink = data[i][18]; // Column S
        const clientCode = data[i][15]; // Column P - Access Code

        // Update status (column B, index 1)
        sheet.getRange(i + 1, 2).setValue(status);

        // Handle receipt lifecycle based on status changes
        if (receiptLink) {
          if (status === 'Receipt Sent' && oldStatus !== 'Receipt Sent') {
            // Update tracker when status becomes "Receipt Sent"
            Logger.log('Status changed to Receipt Sent, updating tracker for: ' + clientName);
            updateReceiptTracker(clientCode, clientName, data[i][10] || '', receiptLink, 'Receipt Sent');
          } else if (status === 'Paid' && oldStatus !== 'Paid') {
            // When status becomes "Paid", rename PDF and copy to receipts folder
            Logger.log('Status changed to Paid, processing receipt for: ' + clientName);

            // Rename PDF in client folder and copy to receipts folder
            renameAndCopyReceiptToPaidFolder(receiptLink, clientName, companyName, clientCode);

            // Update tracker to "Paid" status
            updateReceiptTracker(clientCode, clientName, data[i][10] || '', receiptLink, 'Paid');
          }
        }

        return createAdminResponse(true, 'Client status updated successfully');
      }
    }

    return createAdminResponse(false, 'Client not found');
  } catch (error) {
    Logger.log('Error in updateClientStatus: ' + error.toString());
    return createAdminResponse(false, 'Error updating client status: ' + error.toString());
  }
}

// Update client notes
function updateClientNotes(accessCode, notes) {
  try {
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const data = sheet.getDataRange().getValues();

    // Find the client by access code (column P, index 15)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        // Update notes (column T, index 19, cell position 20)
        sheet.getRange(i + 1, 20).setValue(notes || '');
        return createAdminResponse(true, 'Notes updated successfully');
      }
    }

    return createAdminResponse(false, 'Client not found');
  } catch (error) {
    Logger.log('Error in updateClientNotes: ' + error.toString());
    return createAdminResponse(false, 'Error updating notes: ' + error.toString());
  }
}

// Delete client (removes row from sheet and deletes folder from Drive)
function deleteClient(accessCode, driveLink) {
  try {
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    Logger.log('Deleting client with access code: ' + accessCode);
    Logger.log('Drive link: ' + driveLink);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    let rowToDelete = -1;

    // Find the client row by access code (column P, index 15)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        rowToDelete = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (rowToDelete === -1) {
      return createAdminResponse(false, 'Client not found');
    }

    // Delete the row from the sheet
    sheet.deleteRow(rowToDelete);
    Logger.log('Deleted row ' + rowToDelete + ' from sheet');

    // Delete the folder from Google Drive if driveLink is provided
    if (driveLink) {
      try {
        // Extract folder ID from the Drive link
        let folderId = '';
        if (driveLink.includes('/folders/')) {
          folderId = driveLink.split('/folders/')[1].split('?')[0];
        } else if (driveLink.includes('id=')) {
          folderId = driveLink.split('id=')[1].split('&')[0];
        }

        if (folderId) {
          const folder = DriveApp.getFolderById(folderId);
          folder.setTrashed(true); // Move to trash instead of permanent delete
          Logger.log('Moved folder to trash: ' + folderId);
        } else {
          Logger.log('Could not extract folder ID from drive link');
        }
      } catch (driveError) {
        Logger.log('Error deleting folder: ' + driveError.toString());
        // Continue even if folder deletion fails
      }
    }

    return createAdminResponse(true, 'Client deleted successfully');
  } catch (error) {
    Logger.log('Error in deleteClient: ' + error.toString());
    return createAdminResponse(false, 'Error deleting client: ' + error.toString());
  }
}

// Update client information (email, phone, company, language)
function updateClient(data) {
  try {
    const accessCode = data.accessCode;
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    Logger.log('Updating client with access code: ' + accessCode);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const sheetData = sheet.getDataRange().getValues();
    let rowToUpdate = -1;

    // Find the client row by access code (column P, index 15)
    for (let i = 1; i < sheetData.length; i++) {
      if (String(sheetData[i][15]) === String(accessCode)) {
        rowToUpdate = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (rowToUpdate === -1) {
      return createAdminResponse(false, 'Client not found');
    }

    // Update fields if provided
    if (data.name !== undefined) {
      sheet.getRange(rowToUpdate, 4).setValue(data.name); // Column D - Name
      Logger.log('Updated name: ' + data.name);
    }
    if (data.email !== undefined) {
      sheet.getRange(rowToUpdate, 6).setValue(data.email); // Column F - Email
      Logger.log('Updated email: ' + data.email);
    }
    if (data.phone !== undefined) {
      sheet.getRange(rowToUpdate, 7).setValue(data.phone); // Column G - Phone
      Logger.log('Updated phone: ' + data.phone);
    }
    if (data.company !== undefined) {
      sheet.getRange(rowToUpdate, 5).setValue(data.company); // Column E - Company
      Logger.log('Updated company: ' + data.company);
    }
    if (data.language !== undefined) {
      sheet.getRange(rowToUpdate, 8).setValue(data.language); // Column H - Language
      Logger.log('Updated language: ' + data.language);
    }

    return createAdminResponse(true, 'Client information updated successfully');
  } catch (error) {
    Logger.log('Error in updateClient: ' + error.toString());
    return createAdminResponse(false, 'Error updating client: ' + error.toString());
  }
}

// Get all expenses and calculate total from column C
function getAllExpenses() {
  try {
    const ss = SpreadsheetApp.openById(EXPENSE_SHEET_ID);
    const sheet = ss.getSheetByName(EXPENSE_SHEET_NAME);
    
    if (!sheet) {
      return createAdminResponse(false, 'Expenses sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const expenses = [];
    let totalExpenses = 0;
    
    // Skip header row, start from index 1
    // Columns: A=Date, B=Vendor, C=Total, D=Category, E=Image Link
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      // Column C (index 2) contains the total
      const total = row[2] || '';
      const totalValue = parseFloat(String(total).replace(/[^0-9.-]+/g, ''));
      
      if (!isNaN(totalValue)) {
        totalExpenses += totalValue;
      }
      
      const expense = {
        date: row[0] || '',
        vendor: row[1] || '',
        total: total,
        category: row[3] || '',
        imageLink: row[4] || ''
      };
      
      expenses.push(expense);
    }
    
    return createAdminResponse(true, 'Expenses loaded successfully', { 
      expenses, 
      totalExpenses 
    });
  } catch (error) {
    Logger.log('Error in getAllExpenses: ' + error.toString());
    return createAdminResponse(false, 'Error loading expenses: ' + error.toString());
  }
}

// Get calculator data from Price sheet
function getCalculatorData() {
  try {
    const ss = SpreadsheetApp.openById(CALCULATOR_SHEET_ID);
    const sheet = ss.getSheetByName(PRICE_SHEET_NAME) || ss.getSheetByName(CALCULATOR_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Calculator sheet not found');
    }

    const data = sheet.getDataRange().getValues();

    // Parse materials (rows 2-7, columns A-G)
    const materials = [];
    for (let i = 1; i <= 6; i++) {
      if (data[i] && data[i][0]) {
        materials.push({
          name: data[i][0],
          rollWidth: data[i][1],
          rollLength: data[i][2],
          rollPrice: data[i][3],
          taxesShipping: data[i][4],
          totalSqInches: data[i][5],
          pricePerSqIn: data[i][6]
        });
      }
    }

    // Parse service prices from rows 2-7 (same as materials, columns I & J)
    // These are the material rows that also have cost and price per sq in
    const services = [];
    for (let i = 1; i <= 6; i++) {
      if (data[i] && data[i][0]) {
        // Only add if there's actual pricing data in columns I or J
        const costPerSqIn = parseFloat(data[i][8]) || 0;
        const pricePerSqIn = parseFloat(data[i][9]) || 0;

        if (costPerSqIn > 0 || pricePerSqIn > 0) {
          services.push({
            name: data[i][0],
            costPerSqIn: costPerSqIn,
            pricePerSqIn: pricePerSqIn
          });
        }
      }
    }

    const calculatorData = {
      materials: materials,
      services: services
    };

    Logger.log('Calculator data loaded: ' + services.length + ' services found');
    return createAdminResponse(true, 'Calculator data loaded', { data: calculatorData });
  } catch (error) {
    Logger.log('Error in getCalculatorData: ' + error.toString());
    return createAdminResponse(false, 'Error loading calculator data: ' + error.toString());
  }
}

// Calculate sticker price
function calculateStickerPrice(params) {
  try {
    const height = parseFloat(params.height);
    const width = parseFloat(params.width);
    const quantity = parseInt(params.quantity) || 1;
    const multiplier = parseFloat(params.multiplier) || 4;
    const service = params.service || 'Vinyl Paper w/ Laminate';
    
    const ss = SpreadsheetApp.openById(CALCULATOR_SHEET_ID);
    const sheet = ss.getSheetByName(PRICE_SHEET_NAME) || ss.getSheetByName(CALCULATOR_SHEET_NAME);
    
    if (!sheet) {
      return createAdminResponse(false, 'Calculator sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Get material costs from Price sheet
    const vinylPaperCost = data[2][6]; // Row 3, Column G
    const laminateCost = data[4][6]; // Row 5, Column G
    const inkCost = data[6][6]; // Row 7, Column G
    const blackGlossCost = data[3][6]; // Row 4, Column G
    
    // Calculate total square inches
    const totalSqInches = height * width * quantity;
    
    // Calculate costs based on service type
    let materialCost = 0;
    let printingCost = 0;
    
    if (service === 'Vinyl Paper w/ Laminate') {
      materialCost = (vinylPaperCost + laminateCost) * totalSqInches;
      printingCost = inkCost * totalSqInches;
    } else if (service === 'Vinyl Paper wo/ Laminate') {
      materialCost = vinylPaperCost * totalSqInches;
      printingCost = inkCost * totalSqInches;
    } else if (service === 'Black Gloss Cut Only') {
      materialCost = blackGlossCost * totalSqInches;
      printingCost = 0;
    }
    
    const totalCost = materialCost + printingCost;
    const suggestedPrice = totalCost * multiplier;
    const profit = suggestedPrice - totalCost;
    
    const calculation = {
      totalSqInches,
      materialCost,
      printingCost,
      totalCost,
      suggestedPrice,
      profit
    };
    
    return createAdminResponse(true, 'Price calculated', { calculation });
  } catch (error) {
    Logger.log('Error in calculateStickerPrice: ' + error.toString());
    return createAdminResponse(false, 'Error calculating price: ' + error.toString());
  }
}

// Get time entries for a client
function getTimeEntries(code) {
  try {
    // Get client to find their timesheet
    const clientResponse = JSON.parse(getClient(code).getContent());
    
    if (!clientResponse.success || !clientResponse.client.timesheetLink) {
      return createAdminResponse(true, 'No timesheet found', { entries: [] });
    }
    
    // Extract sheet ID from timesheet link
    const timesheetId = extractSheetId(clientResponse.client.timesheetLink);
    
    if (!timesheetId) {
      return createAdminResponse(false, 'Invalid timesheet link');
    }
    
    const ss = SpreadsheetApp.openById(timesheetId);
    const sheet = ss.getSheets()[0]; // Get first sheet
    const data = sheet.getDataRange().getValues();
    const entries = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // Skip empty rows

      entries.push({
        date: row[0] || '',
        startTime: row[1] || '',
        endTime: row[2] || '',
        task: row[3] || '',
        notes: row[4] || '',
        duration: row[5] || 0,
        employeeName: row[6] || '' // Column G - Employee name
      });
    }
    
    return createAdminResponse(true, 'Time entries loaded', { entries });
  } catch (error) {
    Logger.log('Error in getTimeEntries: ' + error.toString());
    return createAdminResponse(false, 'Error loading time entries: ' + error.toString());
  }
}

// Add time entry to client's timesheet AND employee's timesheet
function addTimeEntry(params) {
  try {
    const code = params.code;
    const employeeName = params.employeeName; // NEW: Employee name parameter

    // Get client to find their timesheet and name
    const clientResponse = JSON.parse(getClient(code).getContent());

    if (!clientResponse.success || !clientResponse.client.timesheetLink) {
      return createAdminResponse(false, 'No timesheet found for this client');
    }

    // Add entry to client's timesheet (existing functionality)
    const timesheetId = extractSheetId(clientResponse.client.timesheetLink);
    const ss = SpreadsheetApp.openById(timesheetId);
    const sheet = ss.getSheets()[0];

    // Columns: A=Date, B=Start Time, C=End Time, D=Task, E=Notes, F=Duration, G=Employee
    sheet.appendRow([
      params.date,
      params.startTime,
      params.endTime,
      params.task,
      params.notes,
      params.duration,
      employeeName || '' // Column G - Employee name
    ]);

    // NEW: Also add entry to employee's timesheet if employee is specified
    if (employeeName) {
      const clientName = clientResponse.client.name || 'Unknown Client';
      const clientCompany = clientResponse.client.company || '';
      const fullClientName = clientCompany ? clientName + ' (' + clientCompany + ')' : clientName;
      const clientCode = clientResponse.client.accessCode || code;

      addToEmployeeTimesheet(
        employeeName,
        params.date,
        params.startTime,
        params.endTime,
        params.duration,
        fullClientName,
        clientCode,
        params.task,
        params.notes
      );
    }

    return createAdminResponse(true, 'Time entry added successfully');
  } catch (error) {
    Logger.log('Error in addTimeEntry: ' + error.toString());
    return createAdminResponse(false, 'Error adding time entry: ' + error.toString());
  }
}

// Create timesheet for a client
function createTimesheet(code, clientName) {
  try {
    // Get client's drive folder from Master sheet first (need it to place timesheet in correct folder)
    const masterSs = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterSheet = masterSs.getSheetByName(MASTER_SHEET_NAME);
    const data = masterSheet.getDataRange().getValues();

    let clientRowIndex = -1;
    let driveLink = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][15] == code) { // Column P (index 15 - revision code)
        clientRowIndex = i;
        driveLink = data[i][11] || ''; // Column L - Drive folder link
        break;
      }
    }

    if (clientRowIndex < 0) {
      return createAdminResponse(false, 'Client not found');
    }

    // Copy the template
    const template = SpreadsheetApp.openById(TIMESHEET_TEMPLATE_ID);
    const newSheet = template.copy(clientName + ' - Timesheet');
    const newSheetId = newSheet.getId();
    const newSheetUrl = newSheet.getUrl();

    // Move timesheet to client's project folder (instead of leaving in My Drive root)
    if (driveLink) {
      const folderId = extractFolderId(driveLink);
      if (folderId) {
        try {
          const timesheetFile = DriveApp.getFileById(newSheetId);
          const clientFolder = DriveApp.getFolderById(folderId);
          timesheetFile.moveTo(clientFolder);
          Logger.log('Timesheet moved to client folder: ' + folderId);
        } catch (moveError) {
          Logger.log('Warning: Could not move timesheet to client folder: ' + moveError.toString());
          // Timesheet was created successfully, just not in the right place
        }
      }
    }

    // Open the new timesheet and add Employee column if needed
    const timesheetSs = SpreadsheetApp.openById(newSheetId);
    const timesheetSheet = timesheetSs.getSheets()[0];

    // Check if column G (Employee) exists in header
    const headerRow = timesheetSheet.getRange(1, 1, 1, 7).getValues()[0];
    if (!headerRow[6] || headerRow[6] !== 'Employee') {
      // Add "Employee" header to column G
      timesheetSheet.getRange(1, 7).setValue('Employee');
      Logger.log('Added Employee column to new timesheet');
    }

    // Update the Master sheet with the new timesheet link
    masterSheet.getRange(clientRowIndex + 1, 23).setValue(newSheetUrl);

    // Set formula in Column V (position 22) to calculate total hours from timesheet
    const formula = '=IFERROR(SUM(IMPORTRANGE("' + newSheetUrl + '","Sheet1!F:F"))/60,0)';
    masterSheet.getRange(clientRowIndex + 1, 22).setValue(formula);

    return createAdminResponse(true, 'Timesheet created successfully', {
      timesheetUrl: newSheetUrl
    });
  } catch (error) {
    Logger.log('Error in createTimesheet: ' + error.toString());
    return createAdminResponse(false, 'Error creating timesheet: ' + error.toString());
  }
}

// Helper function to extract sheet ID from URL
function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Get total hours for a client
function getTotalHours(code) {
  try {
    const entriesResponse = JSON.parse(getTimeEntries(code).getContent());

    if (!entriesResponse.success) {
      return createAdminResponse(false, 'Error loading time entries');
    }

    const entries = entriesResponse.entries || [];
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = totalMinutes / 60;

    return createAdminResponse(true, 'Total hours calculated', { totalHours });
  } catch (error) {
    return createAdminResponse(false, 'Error calculating total hours: ' + error.toString());
  }
}

// Get boat name from brief document
function getBoatName(briefId) {
  try {
    if (!briefId) {
      return createAdminResponse(false, 'Brief ID is required');
    }

    // Open the Google Doc
    const doc = DocumentApp.openById(briefId);
    const body = doc.getBody();
    const text = body.getText();

    // Search for "BoatName:" in the document
    const match = text.match(/BoatName:\s*(.+)/i);

    if (match && match[1]) {
      const boatName = match[1].trim();
      return createAdminResponse(true, 'Boat name found', { boatName });
    }

    return createAdminResponse(false, 'Boat name not found in brief');
  } catch (error) {
    Logger.log('Error in getBoatName: ' + error.toString());
    return createAdminResponse(false, 'Error reading brief: ' + error.toString());
  }
}

// Get full brief content for organized display
function getBriefContent(briefId) {
  try {
    if (!briefId) {
      return createAdminResponse(false, 'Brief ID is required');
    }

    // Open the Google Doc
    const doc = DocumentApp.openById(briefId);
    const body = doc.getBody();
    const text = body.getText();

    // Parse the brief content into structured data
    const briefData = {};

    // Common fields to extract
    const fields = [
      'BoatName', 'Owner', 'OwnerName', 'ClientName', 'Name',
      'Email', 'Phone', 'PhoneNumber',
      'BoatType', 'Type', 'Model',
      'Location', 'Marina',
      'Color', 'Colors', 'VinylColor',
      'Dimensions', 'Size', 'Height', 'Width', 'Length',
      'Material', 'VinylType',
      'Deadline', 'DueDate', 'CompletionDate',
      'Budget', 'Price', 'Cost', 'EstimatedCost',
      'SpecialInstructions', 'Instructions', 'Notes', 'AdditionalNotes',
      'Description', 'ProjectDescription', 'AdditionalInformation',
      // Boat-specific fields
      'NamesFront', 'NameStern', 'BoatLocation',
      'NeedNumbers', 'WhatNumbers',
      'NameCabinCap', 'FrontCapText', 'BackCapText',
      'BowDesign', 'ExistingDesign', 'LayoutIdeas',
      'HullColor', 'CabinColor'
    ];

    // Extract each field if it exists
    fields.forEach(field => {
      const regex = new RegExp(field + ':\\s*(.+?)(?=\\n[A-Z]|$)', 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        briefData[field] = match[1].trim();
      }
    });

    // Get the full text as well
    briefData.fullText = text;

    return createAdminResponse(true, 'Brief content retrieved', { briefData });
  } catch (error) {
    Logger.log('Error in getBriefContent: ' + error.toString());
    return createAdminResponse(false, 'Error reading brief: ' + error.toString());
  }
}

// ====== RECEIPT UPLOAD FUNCTIONS ======

// Upload image to Google Drive and return public URL
function uploadImageToDrive(data) {
  try {
    const imageBase64 = data.imageBase64 || data.data;
    const fileName = 'receipt_' + new Date().getTime() + '.jpg';
    const mimeType = data.mimeType || 'image/jpeg';

    if (!imageBase64) throw new Error('No image data provided');

    const blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), mimeType, fileName);

    const tempFolder = getOrCreateSubFolder(getOrCreateFolder(EXPENSE_FOLDER_NAME), 'Temp');
    const file = tempFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      imageUrl: `https://drive.google.com/uc?id=${file.getId()}`,
      fileId: file.getId(),
      fileName,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Upload failed: ' + err })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Extract receipt data from image URL using OpenAI Vision API
function extractFromImageUrl(data) {
  try {
    const imageUrl = data.imageUrl;
    if (!imageUrl) {
      throw new Error('Missing imageUrl');
    }

    Logger.log('Extracting from image URL: ' + imageUrl);

    const prompt = `Analyze this receipt image and extract the following information. Return ONLY a valid JSON object with these exact fields:

{
  "date": "YYYY-MM-DD format",
  "vendor": "store or business name",
  "total": "total amount as number (e.g., 15.99)",
  "category": "one of: Office Supplies, Packaging, Equipment, Gas, Food, Other"
}

Important: Return ONLY the JSON object, no other text or explanation.`;

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + OPENAI_API_KEY
      },
      payload: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt data extraction assistant. You MUST return only valid JSON with the exact structure requested. No explanations, no markdown formatting, just pure JSON.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 300
      })
    });

    const result = JSON.parse(response.getContentText());
    Logger.log('OpenAI API response received');

    if (result.error) {
      throw new Error('OpenAI API error: ' + result.error.message);
    }

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    let reply = result.choices[0].message.content.trim();
    Logger.log('Raw AI response: ' + reply);

    // Clean the response - remove markdown formatting if present
    reply = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      reply = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch (parseError) {
      Logger.log('JSON parse error: ' + parseError);

      // Try to create a basic structure from the response
      const dateMatch = reply.match(/(\d{4}-\d{2}-\d{2})/);
      const totalMatch = reply.match(/(\d+\.?\d*)/);
      const vendorMatch = reply.match(/"vendor":\s*"([^"]+)"/i) || reply.match(/vendor[:\s]+([^\n,}]+)/i);
      const categoryMatch = reply.match(/"category":\s*"([^"]+)"/i) || reply.match(/category[:\s]+([^\n,}]+)/i);

      parsed = {
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        vendor: vendorMatch ? vendorMatch[1].trim() : '',
        total: totalMatch ? parseFloat(totalMatch[1]) : 0,
        category: categoryMatch ? categoryMatch[1].trim() : 'Other'
      };
    }

    // Validate and clean the parsed data
    const cleanedData = {
      date: parsed.date || new Date().toISOString().split('T')[0],
      vendor: (parsed.vendor || '').toString().trim(),
      total: parseFloat(parsed.total) || 0,
      category: (parsed.category || 'Other').toString().trim()
    };

    // Ensure category is valid
    const validCategories = ['Office Supplies', 'Packaging', 'Equipment', 'Gas', 'Food', 'Other'];
    if (!validCategories.includes(cleanedData.category)) {
      cleanedData.category = 'Other';
    }

    Logger.log('Final cleaned data: ' + JSON.stringify(cleanedData));

    return ContentService.createTextOutput(JSON.stringify(cleanedData)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Extraction error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Extraction failed: ' + err.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Save expense to Google Sheets and organize image in Drive
function saveExpenseToSheet(data) {
  try {
    const { date, vendor, total, category } = data;

    if (!date || !vendor || !total || !category) {
      throw new Error('Missing required fields');
    }

    const ss = SpreadsheetApp.openById(EXPENSE_SHEET_ID);
    const sheet = ss.getSheetByName(EXPENSE_SHEET_NAME);

    if (!sheet) {
      throw new Error('Expenses sheet not found');
    }

    // Add header row if missing
    if (!sheet.getRange(1, 1).getValue()) {
      sheet.getRange(1, 1, 1, 5).setValues([['Date', 'Vendor', 'Total', 'Category', 'Image Link']]);
    }

    // Prepare folder paths
    const year = date.split('-')[0];
    const finalFileName = `${vendor.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.jpg`;

    const rootFolder = getOrCreateFolder(EXPENSE_FOLDER_NAME);
    const tempFolder = getOrCreateSubFolder(rootFolder, 'Temp');
    const yearFolder = getOrCreateSubFolder(rootFolder, year);

    let file = null;
    const tempFiles = tempFolder.getFiles();
    while (tempFiles.hasNext()) {
      const f = tempFiles.next();
      if (f.getName().includes('receipt')) {
        file = f;
        break;
      }
    }

    let imageUrl = '';
    if (file) {
      const blob = file.getBlob().setName(finalFileName);
      const newFile = yearFolder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = `https://drive.google.com/uc?id=${newFile.getId()}`;
      tempFolder.removeFile(file);
    } else {
      imageUrl = 'Image not found in Temp';
    }

    // Save the row
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, 5).setValues([[date, vendor, total, category, imageUrl]]);

    Logger.log('Expense saved successfully to row: ' + row);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      row,
      imageUrl,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Save error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Save failed: ' + err.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ====== ADD NEW CLIENT FUNCTION ======

// Helper function to convert service names to match Google Sheet dropdown format
function convertServiceFormat(service) {
  // Convert to lowercase and replace spaces with hyphens
  return service.toLowerCase().replace(/\s+/g, '-');
}

function addNewClient(data) {
  try {
    Logger.log('Adding new client: ' + (data.name || 'Unknown'));

    const clientName = data.name || 'Unknown Name';
    const companyName = data.company || 'Unknown Company';
    const service = data.service || 'Other';
    const serviceForSheet = convertServiceFormat(service); // Convert for Google Sheet format
    const email = data.email || '';
    const phone = data.phone || '';
    const language = data.language || '';

    // Create folder structure (use original service name for folders)
    const folderData = createClientFolders(clientName, companyName, service, data);
    const driveLink = folderData.serviceFolder.getUrl();
    const uploadLink = folderData.uploadsFolder.getUrl();

    // Create brief document
    const briefUrl = createBriefDocument(data, folderData.serviceFolder);

    // Generate access code
    const accessCode = Math.floor(1000 + Math.random() * 9000);

    // Add to Master sheet
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!masterSheet) {
      throw new Error('Master sheet not found');
    }

    masterSheet.appendRow([
      new Date(),           // A - Date
      'New',                // B - Status
      '',                   // C - Priority
      clientName,           // D - Name
      companyName,          // E - Company
      email,                // F - Email
      phone,                // G - Phone
      language,             // H - Language
      serviceForSheet,      // I - Service (converted to lowercase-hyphen format)
      '',                   // J - Cost
      '',                   // K - Price
      driveLink,            // L - Drive Link
      briefUrl,             // M - Brief Link
      '',                   // N - Estimate Link
      '',                   // O - Revision Link
      accessCode,           // P - Access Code
      uploadLink,           // Q - Upload Link
      '',                   // R - Quote Link
      '',                   // S - Receipt Link
      '',                   // T - Notes
      '',                   // U - Time Amount
      '',                   // V - Auto-calculated hours
      ''                    // W - Timesheet Link
    ]);

    Logger.log('Client added successfully with access code: ' + accessCode);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Client added successfully',
      accessCode: accessCode,
      driveLink: driveLink,
      briefUrl: briefUrl,
      uploadLink: uploadLink
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error adding client: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Failed to add client: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Create client folder structure
function createClientFolders(clientName, companyName, service, data) {
  const masterFolderName = 'Heavy D Master';
  const baseFolderName = 'Clients';

  // Clean names
  const cleanClientName = cleanFolderNameAdmin(clientName);
  const cleanCompanyName = cleanFolderNameAdmin(companyName);

  // Determine service folder name
  let serviceFolderName = service;
  if (service === 'Boat Lettering' && data.boatName) {
    serviceFolderName = cleanFolderNameAdmin(data.boatName);
  } else {
    serviceFolderName = cleanFolderNameAdmin(service);
  }

  // Get/create folder hierarchy
  const masterFolder = getFolderByName(masterFolderName);
  if (!masterFolder) throw new Error('Master folder not found');

  const clientsFolder = getOrCreateSubFolder(masterFolder, baseFolderName);
  const clientFolder = getOrCreateSubFolder(clientsFolder, cleanClientName);
  const companyFolder = getOrCreateSubFolder(clientFolder, cleanCompanyName);

  // Create unique service folder
  let projectFolderName = serviceFolderName;
  let suffix = 2;
  while (companyFolder.getFoldersByName(projectFolderName).hasNext()) {
    projectFolderName = serviceFolderName + '_' + suffix;
    suffix++;
  }

  const serviceFolder = companyFolder.createFolder(projectFolderName);
  const uploadsFolder = serviceFolder.createFolder('Uploads');
  const revisionsFolder = serviceFolder.createFolder('Revisions');

  // Set uploads folder permissions
  uploadsFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

  return {
    serviceFolder: serviceFolder,
    uploadsFolder: uploadsFolder,
    revisionsFolder: revisionsFolder
  };
}

// Create brief document
function createBriefDocument(data, serviceFolder) {
  const companyName = data.company || 'Unknown Company';
  const service = data.service || 'Service';
  const docName = 'Brief - ' + companyName + ' - ' + service;

  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  // Title
  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Created: ' + new Date().toLocaleString()).setBold(true);

  // Basic info
  body.appendParagraph('\n--- Client Information ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  if (data.name) body.appendParagraph('Name: ' + data.name);
  if (data.company) body.appendParagraph('Company: ' + data.company);
  if (data.email) body.appendParagraph('Email: ' + data.email);
  if (data.phone) body.appendParagraph('Phone: ' + data.phone);
  if (data.language) body.appendParagraph('Preferred Language: ' + data.language);
  if (data.service) body.appendParagraph('Service: ' + data.service);

  // Service-specific details
  body.appendParagraph('\n--- Service Details ---').setHeading(DocumentApp.ParagraphHeading.HEADING2);

  // Add all additional fields
  Object.keys(data).forEach(function(key) {
    if (!['name', 'company', 'email', 'phone', 'language', 'service', 'mode', 'action'].includes(key)) {
      const value = data[key];
      if (value && value.toString().trim() !== '') {
        if (typeof value === 'object') {
          body.appendParagraph(capitalize(key) + ': ' + JSON.stringify(value, null, 2));
        } else {
          body.appendParagraph(capitalize(key) + ': ' + value);
        }
      }
    }
  });

  // Move doc to service folder
  const file = DriveApp.getFileById(doc.getId());
  serviceFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return doc.getUrl();
}

// Helper function to get folder by name
function getFolderByName(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : null;
}

// Helper function to get or create a folder
function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

// Helper function to get or create a subfolder
function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

// Clean folder name (named to avoid conflict with website.gs cleanFolderName in same project)
function cleanFolderNameAdmin(name) {
  return String(name || '')
    .replace(/@/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Capitalize string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Create quote from template
function createQuote(accessCode) {
  try {
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    Logger.log('Creating quote for client: ' + accessCode);

    // Get client data
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    let clientRow = -1;
    let clientData = null;

    // Find client by access code (column P, index 15)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        clientRow = i + 1; // +1 because sheet rows are 1-indexed
        clientData = data[i];
        break;
      }
    }

    if (!clientData) {
      return createAdminResponse(false, 'Client not found');
    }

    // Check if quote already exists
    if (clientData[17]) { // Column R - Quote Link
      return createAdminResponse(false, 'Quote already exists for this client');
    }

    // Determine language (column H, index 7)
    const language = String(clientData[7] || 'English').toLowerCase();
    const isFrench = language.includes('french') || language.includes('franÃ§ais');

    // Select template based on language
    const templateId = isFrench ? QUOTE_TEMPLATE_FR_ID : QUOTE_TEMPLATE_EN_ID;

    if (!templateId || templateId === 'YOUR_ENGLISH_QUOTE_TEMPLATE_ID' || templateId === 'YOUR_FRENCH_QUOTE_TEMPLATE_ID') {
      return createAdminResponse(false, 'Quote template not configured. Please set template IDs in code.gs');
    }

    // Get client folder from Drive Link (column L, index 11)
    const driveLink = clientData[11];
    let clientFolder = null;

    if (driveLink) {
      const folderId = extractFolderId(driveLink);
      if (folderId) {
        try {
          clientFolder = DriveApp.getFolderById(folderId);
        } catch (e) {
          Logger.log('Could not access client folder: ' + e.toString());
        }
      }
    }

    // Copy template
    const templateFile = DriveApp.getFileById(templateId);
    const clientName = clientData[3] || 'Client'; // Column D
    const companyName = clientData[4] || ''; // Column E
    const docName = 'Quote - ' + clientName + (companyName ? ' - ' + companyName : '');
    const newFile = templateFile.makeCopy(docName);

    // Move to client folder if available
    if (clientFolder) {
      clientFolder.addFile(newFile);
      DriveApp.getRootFolder().removeFile(newFile);
    }

    // Open document and replace placeholders
    const doc = DocumentApp.openById(newFile.getId());
    const body = doc.getBody();

    // Get data from estimate sheet if available
    let estimateData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    };
    const estimateLink = clientData[13]; // Column N
    if (estimateLink) {
      try {
        const estimateId = extractDocId(estimateLink);
        if (estimateId) {
          estimateData = extractEstimateData(estimateId);
        }
      } catch (e) {
        Logger.log('Could not extract estimate data: ' + e.toString());
      }
    }

    // Replace common placeholders
    const today = new Date();
    const clientEmail = clientData[5] || '';
    const serviceName = clientData[8] || '';

    // Client information
    body.replaceText('{{client_name}}', clientName);
    body.replaceText('{{ClientName}}', clientName); // Legacy support

    // Only add email if it's not info@heavydetailing.com
    if (clientEmail && clientEmail.toLowerCase() !== 'info@heavydetailing.com') {
      body.replaceText('{{client_email}}', clientEmail);
      body.replaceText('{{Email}}', clientEmail); // Legacy support
    } else {
      body.replaceText('{{client_email}}', '');
      body.replaceText('{{Email}}', '');
    }

    body.replaceText('{{Company}}', clientData[4] || '');
    body.replaceText('{{Phone}}', clientData[6] || '');
    body.replaceText('{{service_name}}', serviceName);
    body.replaceText('{{Service}}', serviceName); // Legacy support
    body.replaceText('{{ProjectCode}}', clientData[15] || '');
    body.replaceText('{{issue_date}}', Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    body.replaceText('{{Date}}', Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')); // Legacy support

    // Replace item placeholders (supports up to 20 items)
    if (estimateData.items && estimateData.items.length > 0) {
      for (let i = 0; i < Math.min(estimateData.items.length, 20); i++) {
        const item = estimateData.items[i];
        const itemNum = i + 1; // Start from 1

        body.replaceText('\\{\\{qty_' + itemNum + '\\}\\}', item.quantity.toString());
        body.replaceText('\\{\\{desc_' + itemNum + '\\}\\}', item.description);
        body.replaceText('\\{\\{price_' + itemNum + '\\}\\}', '$' + item.price.toFixed(2));
        body.replaceText('\\{\\{amount_' + itemNum + '\\}\\}', '$' + item.amount.toFixed(2));
      }

      // Clear unused item placeholders (from last item + 1 to 20)
      for (let i = estimateData.items.length + 1; i <= 20; i++) {
        body.replaceText('\\{\\{qty_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{desc_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{price_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{amount_' + i + '\\}\\}', '');
      }
    } else {
      // Clear all item placeholders if no items
      for (let i = 1; i <= 20; i++) {
        body.replaceText('\\{\\{qty_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{desc_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{price_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{amount_' + i + '\\}\\}', '');
      }
    }

    // Replace financial totals (Quote shows total WITHOUT taxes)
    body.replaceText('{{subtotal}}', '$' + estimateData.subtotal.toFixed(2));
    body.replaceText('{{Subtotal}}', '$' + estimateData.subtotal.toFixed(2)); // Legacy support
    body.replaceText('{{tax}}', '$0.00'); // No tax shown on quotes
    body.replaceText('{{Tax}}', '$0.00'); // Legacy support
    body.replaceText('{{total}}', '$' + estimateData.subtotal.toFixed(2)); // Total = Subtotal (no tax)
    body.replaceText('{{Total}}', '$' + estimateData.subtotal.toFixed(2)); // Legacy support

    doc.saveAndClose();

    // Update Master sheet with quote link
    const quoteLink = newFile.getUrl();
    sheet.getRange(clientRow, 18).setValue(quoteLink); // Column R

    Logger.log('Quote created successfully: ' + quoteLink);

    return createAdminResponse(true, 'Quote created successfully', { quoteLink: quoteLink });

  } catch (error) {
    Logger.log('Error creating quote: ' + error.toString());
    return createAdminResponse(false, 'Error creating quote: ' + error.toString());
  }
}

// ====== RECEIPTS TRACKER FUNCTIONS ======

// Get or create receipts tracker sheet
function getReceiptsTrackerSheet() {
  try {
    const ss = SpreadsheetApp.openById(RECEIPTS_TRACKER_SHEET_ID);
    let sheet = ss.getSheetByName(RECEIPTS_TRACKER_SHEET_NAME);

    if (!sheet) {
      // Create the sheet if it doesn't exist
      sheet = ss.insertSheet(RECEIPTS_TRACKER_SHEET_NAME);

      // Add headers
      sheet.getRange(1, 1, 1, 9).setValues([[
        'Date', 'Client Name', 'Client Code', 'Amount', 'Receipt Link',
        'Status', 'Generated Timestamp', 'Sent Timestamp', 'Paid Timestamp'
      ]]);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#000050');
      headerRange.setFontColor('#FFFFFF');
    }

    return sheet;
  } catch (error) {
    Logger.log('Error getting receipts tracker sheet: ' + error.toString());
    return null;
  }
}

// Rename PDF in client folder and copy to receipts folder with year/month structure
function renameAndCopyReceiptToPaidFolder(receiptLink, clientName, companyName, clientCode) {
  try {
    if (!receiptLink) {
      Logger.log('No receipt link provided');
      return;
    }

    // Extract file ID from receipt link
    const fileId = extractDocId(receiptLink);
    if (!fileId) {
      Logger.log('Could not extract file ID from receipt link');
      return;
    }

    // Get the receipt PDF file
    const receiptFile = DriveApp.getFileById(fileId);
    const originalName = receiptFile.getName();

    // Rename file in client folder to include "PAID -" prefix if not already
    if (!originalName.startsWith('PAID -')) {
      const newName = 'PAID - ' + originalName;
      receiptFile.setName(newName);
      Logger.log('Renamed receipt to: ' + newName);
    }

    // Get current year and month for folder structure
    const now = new Date();
    const year = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];

    // Get or create year/month folder structure
    const targetFolder = getOrCreateYearMonthFolder(year, month);
    if (!targetFolder) {
      Logger.log('Could not create target folder');
      return;
    }

    // Check if file already exists in target folder
    const paidFileName = 'PAID - Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';
    const existingFiles = targetFolder.getFilesByName(paidFileName);

    if (!existingFiles.hasNext()) {
      // Make a copy in the receipts folder
      const copiedFile = receiptFile.makeCopy(paidFileName, targetFolder);
      Logger.log('Copied PAID receipt to: ' + year + '/' + month + '/' + paidFileName);
    } else {
      Logger.log('PAID receipt already exists in: ' + year + '/' + month);
    }
  } catch (error) {
    Logger.log('Error in renameAndCopyReceiptToPaidFolder: ' + error.toString());
  }
}

// Add or update receipt in tracker
function updateReceiptTracker(clientCode, clientName, amount, receiptLink, status) {
  try {
    const sheet = getReceiptsTrackerSheet();
    if (!sheet) {
      Logger.log('Could not access receipts tracker sheet');
      return;
    }

    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'America/Halifax', 'yyyy-MM-dd HH:mm');

    // Check if receipt already exists (find by client code)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2]) === String(clientCode)) { // Column C - Client Code
        // Update existing row
        const row = i + 1;
        sheet.getRange(row, 6).setValue(status); // Column F - Status

        // Update appropriate timestamp column
        if (status === 'Generated') {
          sheet.getRange(row, 7).setValue(timestamp); // Generated Timestamp
        } else if (status === 'Receipt Sent') {
          sheet.getRange(row, 8).setValue(timestamp); // Sent Timestamp
        } else if (status === 'Paid') {
          sheet.getRange(row, 9).setValue(timestamp); // Paid Timestamp
        }

        Logger.log('Updated receipt tracker for client: ' + clientCode + ', status: ' + status);
        return;
      }
    }

    // If not found, add new row (only for Generated status)
    if (status === 'Generated') {
      const date = Utilities.formatDate(now, 'America/Halifax', 'yyyy-MM-dd');
      sheet.appendRow([
        date,
        clientName,
        clientCode,
        amount,
        receiptLink,
        status,
        timestamp,
        '',
        ''
      ]);
      Logger.log('Added new receipt to tracker for client: ' + clientCode);
    }
  } catch (error) {
    Logger.log('Error updating receipt tracker: ' + error.toString());
  }
}

// Create receipt from template
function createReceipt(accessCode) {
  try {
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    Logger.log('Creating receipt for client: ' + accessCode);

    // Get client data
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);

    if (!sheet) {
      return createAdminResponse(false, 'Master sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    let clientRow = -1;
    let clientData = null;

    // Find client by access code (column P, index 15)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        clientRow = i + 1; // +1 because sheet rows are 1-indexed
        clientData = data[i];
        break;
      }
    }

    if (!clientData) {
      return createAdminResponse(false, 'Client not found');
    }

    // Check if receipt already exists
    if (clientData[18]) { // Column S - Receipt Link
      return createAdminResponse(false, 'Receipt already exists for this client');
    }

    // Determine language (column H, index 7)
    const language = String(clientData[7] || 'English').toLowerCase();
    const isFrench = language.includes('french') || language.includes('franÃ§ais');

    // Select template based on language
    const templateId = isFrench ? RECEIPT_TEMPLATE_FR_ID : RECEIPT_TEMPLATE_EN_ID;

    if (!templateId || templateId === 'YOUR_ENGLISH_RECEIPT_TEMPLATE_ID' || templateId === 'YOUR_FRENCH_RECEIPT_TEMPLATE_ID') {
      return createAdminResponse(false, 'Receipt template not configured. Please set template IDs in code.gs');
    }

    // Get client folder from Drive Link (column L, index 11)
    const driveLink = clientData[11];
    let clientFolder = null;

    if (driveLink) {
      const folderId = extractFolderId(driveLink);
      if (folderId) {
        try {
          clientFolder = DriveApp.getFolderById(folderId);
        } catch (e) {
          Logger.log('Could not access client folder: ' + e.toString());
        }
      }
    }

    // Copy template
    const templateFile = DriveApp.getFileById(templateId);
    const clientName = clientData[3] || 'Client'; // Column D
    const companyName = clientData[4] || ''; // Column E
    const docName = 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '');
    const newFile = templateFile.makeCopy(docName);

    // Move to client folder if available
    if (clientFolder) {
      clientFolder.addFile(newFile);
      DriveApp.getRootFolder().removeFile(newFile);
    }

    // Open document and replace placeholders
    const doc = DocumentApp.openById(newFile.getId());
    const body = doc.getBody();

    // Get data from estimate sheet if available
    let estimateData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    };
    const estimateLink = clientData[13]; // Column N
    if (estimateLink) {
      try {
        const estimateId = extractDocId(estimateLink);
        if (estimateId) {
          estimateData = extractEstimateData(estimateId);
        }
      } catch (e) {
        Logger.log('Could not extract estimate data: ' + e.toString());
      }
    }

    // Replace common placeholders
    const today = new Date();
    const clientEmail = clientData[5] || '';
    const serviceName = clientData[8] || '';

    // Generate receipt ID (using access code + timestamp)
    const receiptId = 'R-' + clientData[15] + '-' + today.getFullYear();

    // Client information
    body.replaceText('{{client_name}}', clientName);
    body.replaceText('{{ClientName}}', clientName); // Legacy support
    body.replaceText('{{receipt_id}}', receiptId);
    body.replaceText('{{ReceiptId}}', receiptId); // Legacy support

    // Only add email if it's not info@heavydetailing.com
    if (clientEmail && clientEmail.toLowerCase() !== 'info@heavydetailing.com') {
      body.replaceText('{{client_email}}', clientEmail);
      body.replaceText('{{Email}}', clientEmail); // Legacy support
    } else {
      body.replaceText('{{client_email}}', '');
      body.replaceText('{{Email}}', '');
    }

    body.replaceText('{{Company}}', clientData[4] || '');
    body.replaceText('{{Phone}}', clientData[6] || '');
    body.replaceText('{{service_name}}', serviceName);
    body.replaceText('{{Service}}', serviceName); // Legacy support
    body.replaceText('{{ProjectCode}}', clientData[15] || '');
    body.replaceText('{{issue_date}}', Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    body.replaceText('{{Date}}', Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd')); // Legacy support

    // Replace item placeholders (supports up to 20 items)
    if (estimateData.items && estimateData.items.length > 0) {
      for (let i = 0; i < Math.min(estimateData.items.length, 20); i++) {
        const item = estimateData.items[i];
        const itemNum = i + 1; // Start from 1

        body.replaceText('\\{\\{qty_' + itemNum + '\\}\\}', item.quantity.toString());
        body.replaceText('\\{\\{desc_' + itemNum + '\\}\\}', item.description);
        body.replaceText('\\{\\{price_' + itemNum + '\\}\\}', '$' + item.price.toFixed(2));
        body.replaceText('\\{\\{amount_' + itemNum + '\\}\\}', '$' + item.amount.toFixed(2));
      }

      // Clear unused item placeholders (from last item + 1 to 20)
      for (let i = estimateData.items.length + 1; i <= 20; i++) {
        body.replaceText('\\{\\{qty_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{desc_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{price_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{amount_' + i + '\\}\\}', '');
      }
    } else {
      // Clear all item placeholders if no items
      for (let i = 1; i <= 20; i++) {
        body.replaceText('\\{\\{qty_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{desc_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{price_' + i + '\\}\\}', '');
        body.replaceText('\\{\\{amount_' + i + '\\}\\}', '');
      }
    }

    // Replace financial totals
    body.replaceText('{{subtotal}}', '$' + estimateData.subtotal.toFixed(2));
    body.replaceText('{{Subtotal}}', '$' + estimateData.subtotal.toFixed(2)); // Legacy support
    body.replaceText('{{tax}}', '$' + estimateData.tax.toFixed(2));
    body.replaceText('{{Tax}}', '$' + estimateData.tax.toFixed(2)); // Legacy support
    body.replaceText('{{total}}', '$' + estimateData.total.toFixed(2));
    body.replaceText('{{Total}}', '$' + estimateData.total.toFixed(2)); // Legacy support

    doc.saveAndClose();

    // Convert to PDF
    const pdfBlob = doc.getAs('application/pdf');
    const pdfName = 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';

    // Delete the original Google Doc and create PDF
    const pdfFile = DriveApp.createFile(pdfBlob.setName(pdfName));

    // Move PDF to client folder if available
    if (clientFolder) {
      clientFolder.addFile(pdfFile);
      DriveApp.getRootFolder().removeFile(pdfFile);
    }

    // Delete the original Google Doc
    newFile.setTrashed(true);

    // Update Master sheet with receipt link (PDF link)
    const receiptLink = pdfFile.getUrl();
    sheet.getRange(clientRow, 19).setValue(receiptLink); // Column S

    // Add to receipts tracker with "Generated" status
    const clientCode = clientData[15]; // Column P - Access Code
    const amount = clientData[10] || ''; // Column K - Price
    updateReceiptTracker(clientCode, clientName, amount, receiptLink, 'Generated');

    Logger.log('Receipt created successfully as PDF: ' + receiptLink);

    return createAdminResponse(true, 'Receipt created successfully', { receiptLink: receiptLink });

  } catch (error) {
    Logger.log('Error creating receipt: ' + error.toString());
    return createAdminResponse(false, 'Error creating receipt: ' + error.toString());
  }
}

// Helper function to extract folder ID from Drive URL
function extractFolderId(url) {
  if (!url) return null;
  let match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper function to get or create yearly folder for receipts
function getOrCreateYearlyFolder(year) {
  try {
    const parentFolder = DriveApp.getFolderById(YEARLY_RECEIPTS_FOLDER_ID);
    const yearString = String(year);

    // Check if year folder already exists
    const folders = parentFolder.getFoldersByName(yearString);
    if (folders.hasNext()) {
      return folders.next();
    }

    // Create new year folder if it doesn't exist
    Logger.log('Creating new yearly folder: ' + yearString);
    return parentFolder.createFolder(yearString);
  } catch (e) {
    Logger.log('Error getting/creating yearly folder: ' + e.toString());
    return null;
  }
}

// Helper function to copy receipt to yearly folder as PDF
function copyReceiptToYearlyFolder(receiptFileId, clientName, companyName, year) {
  try {
    const yearFolder = getOrCreateYearlyFolder(year);
    if (!yearFolder) {
      Logger.log('Could not get yearly folder');
      return null;
    }

    // Open the receipt document and export as PDF
    const receiptDoc = DocumentApp.openById(receiptFileId);
    const pdfName = 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';

    // Get the document as PDF blob
    const pdfBlob = receiptDoc.getAs('application/pdf');
    pdfBlob.setName(pdfName);

    // Create PDF file in the yearly folder
    const pdfFile = yearFolder.createFile(pdfBlob);
    Logger.log('Receipt PDF created in yearly folder: ' + pdfFile.getUrl());

    return pdfFile;
  } catch (e) {
    Logger.log('Error copying receipt to yearly folder: ' + e.toString());
    return null;
  }
}

// Helper function to update receipt title to show PAID status
function updateReceiptTitleToPaid(receiptLink, clientName, companyName, year) {
  try {
    if (!receiptLink) return false;

    // Get the yearly folder
    const yearFolder = getOrCreateYearlyFolder(year);
    if (!yearFolder) {
      Logger.log('Could not get yearly folder for updating receipt');
      return false;
    }

    // Find the receipt PDF in the yearly folder
    const searchName = 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';
    const files = yearFolder.getFilesByName(searchName);

    if (files.hasNext()) {
      const receiptFile = files.next();
      const newName = 'PAID - Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';
      receiptFile.setName(newName);
      Logger.log('Receipt PDF renamed to: ' + newName);
      return true;
    } else {
      Logger.log('Receipt PDF not found in yearly folder: ' + searchName);
      return false;
    }
  } catch (e) {
    Logger.log('Error updating receipt title: ' + e.toString());
    return false;
  }
}

// Helper function to extract document/sheet ID from URL
function extractDocId(url) {
  if (!url) return null;

  // If it's already just an ID (no slashes), return it directly
  if (url.indexOf('/') === -1 && url.indexOf('http') === -1) {
    return url;
  }

  // Handle /d/ format (docs and sheets)
  let match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];

  // Handle ?id= format
  match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (match) return match[1];

  // Handle spreadsheets/d/ format
  match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Helper function to extract data from estimate sheet
function extractEstimateData(sheetId) {
  try {
    Logger.log('Extracting estimate data from sheet: ' + sheetId);

    // Open the estimate spreadsheet
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0]; // Get first sheet
    const data = sheet.getDataRange().getValues();

    const estimateData = {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    };

    // Parse items from the estimate sheet
    // Assuming row 0 is headers, data starts from row 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[0] || row[0].toString().trim() === '') {
        continue;
      }

      // Column A: Description
      const description = row[0] ? row[0].toString().trim() : '';

      // Skip header-like rows or summary rows
      if (description.toLowerCase().includes('item') ||
          description.toLowerCase().includes('total') ||
          description.toLowerCase().includes('subtotal') ||
          description.toLowerCase().includes('tax')) {
        continue;
      }

      // Column B: Quantity
      const quantity = row[1] && !isNaN(parseFloat(row[1])) ? parseFloat(row[1]) : 1;

      // Column D: Total price for all units (from estimate sheet)
      const totalPrice = row[3] && !isNaN(parseFloat(row[3])) ? parseFloat(row[3]) : 0;

      // Calculate unit price by dividing total by quantity
      const unitPrice = totalPrice / quantity;

      // Amount is the total price from the estimate sheet
      const amount = totalPrice;

      if (description && amount > 0) {
        estimateData.items.push({
          description: description,
          quantity: quantity,
          price: unitPrice,  // Unit price (total / quantity)
          amount: amount     // Total price from estimate sheet
        });

        estimateData.subtotal += amount;
      }
    }

    // Calculate Quebec taxes (TPS 5% + TVQ 9.975%)
    const TPS_RATE = 0.05;
    const TVQ_RATE = 0.09975;
    const tps = estimateData.subtotal * TPS_RATE;
    const tvq = estimateData.subtotal * TVQ_RATE;
    estimateData.tax = tps + tvq;
    estimateData.total = estimateData.subtotal + estimateData.tax;

    Logger.log('Extracted ' + estimateData.items.length + ' items from estimate');
    Logger.log('Subtotal: ' + estimateData.subtotal.toFixed(2));
    Logger.log('Tax: ' + estimateData.tax.toFixed(2));
    Logger.log('Total: ' + estimateData.total.toFixed(2));

    return estimateData;
  } catch (e) {
    Logger.log('Error extracting estimate data: ' + e.toString());
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    };
  }
}

// ====== EMPLOYEE TIME TRACKING FUNCTIONS ======

// NEW: Add entry to employee's timesheet
function addToEmployeeTimesheet(employeeName, date, startTime, endTime, duration, clientName, clientCode, task, notes) {
  try {
    const employeeSheet = getOrCreateEmployeeSheet(employeeName);

    // Add new row to employee timesheet
    // Columns: Date | Start Time | End Time | Duration (minutes) | Client Name | Client Code | Task | Notes | Paid
    employeeSheet.appendRow([
      date,
      startTime,
      endTime,
      duration,
      clientName,
      clientCode,
      task,
      notes,
      'No' // Default: not paid
    ]);

    Logger.log('Added entry to ' + employeeName + "'s timesheet");
  } catch (error) {
    Logger.log('Error in addToEmployeeTimesheet: ' + error.toString());
    throw error;
  }
}

// NEW: Get or create employee sheet in the employee folder
function getOrCreateEmployeeSheet(employeeName) {
  try {
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';

    // Search for existing employee sheet in the folder
    const files = folder.getFilesByName(sheetName);

    if (files.hasNext()) {
      // Sheet exists, open it
      const file = files.next();
      const spreadsheet = SpreadsheetApp.open(file);
      return spreadsheet.getSheets()[0];
    } else {
      // Create new sheet for this employee
      const newSpreadsheet = SpreadsheetApp.create(sheetName);
      const sheet = newSpreadsheet.getSheets()[0];

      // Set up headers
      sheet.appendRow(['Date', 'Start Time', 'End Time', 'Duration (min)', 'Client Name', 'Client Code', 'Task', 'Notes', 'Paid']);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#000050');
      headerRange.setFontColor('#FFFFFF');

      // Move the file to the employee folder
      const file = DriveApp.getFileById(newSpreadsheet.getId());
      file.moveTo(folder);

      Logger.log('Created new timesheet for employee: ' + employeeName);
      return sheet;
    }
  } catch (error) {
    Logger.log('Error in getOrCreateEmployeeSheet: ' + error.toString());
    throw error;
  }
}

// NEW: Get all employees (by finding all timesheet files in employee folder)
function getAllEmployees() {
  try {
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const files = folder.getFiles();
    const employees = [];

    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();

      // Extract employee name from "Name - Timesheet" format
      if (fileName.indexOf(' - Timesheet') !== -1) {
        const employeeName = fileName.replace(' - Timesheet', '');
        employees.push({
          name: employeeName,
          sheetId: file.getId(),
          sheetUrl: file.getUrl()
        });
      }
    }

    return createAdminResponse(true, 'Employees loaded successfully', { employees: employees });
  } catch (error) {
    Logger.log('Error in getAllEmployees: ' + error.toString());
    return createAdminResponse(false, 'Error loading employees: ' + error.toString());
  }
}

// NEW: Get all time entries for an employee
function getEmployeeEntries(employeeName) {
  try {
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const files = folder.getFilesByName(sheetName);

    if (!files.hasNext()) {
      return createAdminResponse(true, 'No timesheet found for this employee', { entries: [] });
    }

    const file = files.next();
    const spreadsheet = SpreadsheetApp.open(file);
    const sheet = spreadsheet.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    const entries = [];

    // Get Master sheet data to lookup company names and client codes
    const masterSs = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterSheet = masterSs.getSheets()[0];
    const masterData = masterSheet.getDataRange().getValues();

    // Create maps for quick lookup
    const clientCompanyMap = {}; // Maps clientCode -> company
    const clientNameToCodeMap = {}; // Maps clientName -> clientCode

    for (let i = 1; i < masterData.length; i++) {
      const accessCode = String(masterData[i][15] || '').trim(); // Column P (index 15) - Access Code
      const clientName = String(masterData[i][3] || '').trim(); // Column D (index 3) - Name
      const company = String(masterData[i][4] || '').trim(); // Column E (index 4) - Company

      if (accessCode) {
        clientCompanyMap[accessCode] = company;
        if (clientName) {
          // Store by client name for fallback lookup
          clientNameToCodeMap[clientName.toLowerCase()] = { code: accessCode, company: company };
        }
      }
    }

    Logger.log('Built client maps. Total clients: ' + Object.keys(clientCompanyMap).length);

    // Check if row 1 is info row
    const hasInfoRow = data[0][0] === 'EMPLOYEE_INFO';
    const startRow = hasInfoRow ? 2 : 1; // If info row exists, skip it and header (row 2)

    // Skip header row and info row
    // New format: Date | Start | End | Duration | ClientName | ClientCode | Task | Notes | Paid
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // Skip empty rows

      let clientCode = String(row[5] || '').trim();
      let clientName = String(row[4] || '');
      let company = '';

      // Extract clean client name and company from the stored format "Name (Company)"
      const nameMatch = clientName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      let cleanClientName = clientName;
      let extractedCompany = '';

      if (nameMatch) {
        cleanClientName = nameMatch[1].trim();
        extractedCompany = nameMatch[2].trim();
      }

      // Try to lookup by client code first
      if (clientCode && clientCompanyMap[clientCode]) {
        company = clientCompanyMap[clientCode];
      }
      // Fallback: lookup by client name
      else if (cleanClientName) {
        const lookupKey = cleanClientName.toLowerCase();
        if (clientNameToCodeMap[lookupKey]) {
          clientCode = clientNameToCodeMap[lookupKey].code;
          company = clientNameToCodeMap[lookupKey].company;
        } else if (extractedCompany && extractedCompany !== '-' && extractedCompany !== 'Unknown Company') {
          // Use the company from parentheses if lookup failed
          company = extractedCompany;
        }
      }

      entries.push({
        date: row[0] || '',
        startTime: row[1] || '',
        endTime: row[2] || '',
        duration: row[3] || 0,
        clientName: cleanClientName, // Store clean name without parentheses
        clientCode: clientCode,
        company: company,
        task: row[6] || '',
        notes: row[7] || '',
        paid: row[8] || 'No',
        rowIndex: i // Store row index for updates
      });
    }

    Logger.log('Loaded ' + entries.length + ' employee entries');

    return createAdminResponse(true, 'Employee entries loaded', { entries: entries });
  } catch (error) {
    Logger.log('Error in getEmployeeEntries: ' + error.toString());
    return createAdminResponse(false, 'Error loading employee entries: ' + error.toString());
  }
}

// NEW: Mark employee entry as paid/unpaid
function markEmployeeEntryPaid(employeeName, entryIndex, paid) {
  try {
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const files = folder.getFilesByName(sheetName);

    if (!files.hasNext()) {
      return createAdminResponse(false, 'No timesheet found for this employee');
    }

    const file = files.next();
    const spreadsheet = SpreadsheetApp.open(file);
    const sheet = spreadsheet.getSheets()[0];

    // entryIndex is 1-based row number (header is row 1, first entry is row 2)
    // Update the "Paid" column (column 9 in new format)
    const rowNumber = parseInt(entryIndex) + 1; // +1 because rowIndex is 0-based from data, but sheet is 1-based
    sheet.getRange(rowNumber, 9).setValue(paid === 'true' || paid === true ? 'Yes' : 'No');

    return createAdminResponse(true, 'Payment status updated');
  } catch (error) {
    Logger.log('Error in markEmployeeEntryPaid: ' + error.toString());
    return createAdminResponse(false, 'Error updating payment status: ' + error.toString());
  }
}

// Helper function to format date for comparison (handles both Date objects and strings)
function formatDateForComparison(dateValue) {
  if (!dateValue) return '';

  if (dateValue instanceof Date) {
    // Format as YYYY-MM-DD
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  // If it's already a string, try to normalize it
  const str = String(dateValue);
  // If it looks like a date string, return it normalized
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return str.substring(0, 10); // Get just YYYY-MM-DD part
  }

  return str;
}

// Helper function to format time for comparison (handles both Date objects and strings)
function formatTimeForComparison(timeValue) {
  if (!timeValue) return '';

  if (timeValue instanceof Date) {
    // Format as HH:MM
    const hours = String(timeValue.getHours()).padStart(2, '0');
    const minutes = String(timeValue.getMinutes()).padStart(2, '0');
    return hours + ':' + minutes;
  }

  // If it's already a string, normalize it
  const str = String(timeValue);
  // If it looks like HH:MM format
  if (str.match(/^\d{1,2}:\d{2}/)) {
    const parts = str.split(':');
    const hours = String(parseInt(parts[0])).padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return hours + ':' + minutes;
  }

  return str;
}

// NEW: Delete employee time entry and corresponding client timesheet entry
function deleteEmployeeTimeEntry(employeeName, entryRowIndex, clientCode) {
  try {
    Logger.log('Deleting entry for employee: ' + employeeName + ', row: ' + entryRowIndex + ', client code: ' + clientCode);

    // Delete from employee timesheet
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const files = folder.getFilesByName(sheetName);

    if (!files.hasNext()) {
      return createAdminResponse(false, 'No timesheet found for this employee');
    }

    const file = files.next();
    const employeeSpreadsheet = SpreadsheetApp.open(file);
    const employeeSheet = employeeSpreadsheet.getSheets()[0];

    // Get the entry data before deleting to match against client timesheet
    const data = employeeSheet.getDataRange().getValues();
    const rowNumber = parseInt(entryRowIndex) + 1; // Convert 0-based index to 1-based row number

    Logger.log('Delete request: entryRowIndex=' + entryRowIndex + ', rowNumber=' + rowNumber + ', data.length=' + data.length);

    if (rowNumber < 1 || rowNumber > data.length) {
      return createAdminResponse(false, 'Invalid row index: rowNumber=' + rowNumber + ', data.length=' + data.length);
    }

    // Note: rowNumber is now the actual sheet row number (1-based)
    const entryRow = data[entryRowIndex]; // Use entryRowIndex directly for data array access
    const entryDate = entryRow[0];
    const entryStartTime = entryRow[1];
    const entryEndTime = entryRow[2];
    const entryDuration = entryRow[3];

    Logger.log('Entry to delete from data[' + entryRowIndex + '] (sheet row ' + rowNumber + '): ' + entryDate + ' ' + entryStartTime + '-' + entryEndTime + ', duration: ' + entryDuration);

    // Delete the row from employee timesheet
    employeeSheet.deleteRow(rowNumber);
    Logger.log('Deleted sheet row ' + rowNumber + ' from employee timesheet');

    // Now delete the corresponding entry from client's timesheet
    if (clientCode) {
      try {
        // Get client data to find their timesheet
        const clientResponse = JSON.parse(getClient(clientCode).getContent());

        if (clientResponse.success && clientResponse.client.timesheetLink) {
          const clientTimesheetId = extractSheetId(clientResponse.client.timesheetLink);
          const clientSpreadsheet = SpreadsheetApp.openById(clientTimesheetId);
          const clientSheet = clientSpreadsheet.getSheets()[0];
          const clientData = clientSheet.getDataRange().getValues();

          // Convert entry data to comparable formats (handle Date objects and strings)
          const entryDateStr = formatDateForComparison(entryDate);
          const entryStartTimeStr = formatTimeForComparison(entryStartTime);
          const entryEndTimeStr = formatTimeForComparison(entryEndTime);
          const entryDurationNum = Number(entryDuration);

          Logger.log('Looking for entry in client timesheet: Date=' + entryDateStr + ', Start=' + entryStartTimeStr + ', End=' + entryEndTimeStr + ', Duration=' + entryDurationNum);

          // Find matching entry in client timesheet
          // Client timesheet format: Date (0) | Start Time (1) | End Time (2) | Task (3) | Notes (4) | Duration (5) | Employee (6)
          let foundMatch = false;
          for (let i = 1; i < clientData.length; i++) {
            const row = clientData[i];
            const clientDateStr = formatDateForComparison(row[0]);
            const clientStartTimeStr = formatTimeForComparison(row[1]);
            const clientEndTimeStr = formatTimeForComparison(row[2]);
            const clientDurationNum = Number(row[5]);

            if (clientDateStr === entryDateStr &&
                clientStartTimeStr === entryStartTimeStr &&
                clientEndTimeStr === entryEndTimeStr &&
                clientDurationNum === entryDurationNum) {
              // Found matching entry, delete it
              clientSheet.deleteRow(i + 1);
              Logger.log('Successfully deleted matching entry from client timesheet at row ' + (i + 1));
              foundMatch = true;
              break;
            }
          }

          if (!foundMatch) {
            Logger.log('Warning: No matching entry found in client timesheet');
          }
        } else {
          Logger.log('Client timesheet not found or client not found');
        }
      } catch (clientError) {
        Logger.log('Error deleting from client timesheet: ' + clientError.toString());
        // Continue even if client deletion fails
      }
    }

    return createAdminResponse(true, 'Time entry deleted successfully');
  } catch (error) {
    Logger.log('Error in deleteEmployeeTimeEntry: ' + error.toString());
    return createAdminResponse(false, 'Error deleting time entry: ' + error.toString());
  }
}

// NEW: Create a new employee with info
function createEmployee(params) {
  try {
    const employeeName = params.name;
    const employeeEmail = params.email || '';
    const employeePhone = params.phone || '';
    const hireDate = params.hireDate || '';
    const hourlyRate = params.hourlyRate || '';
    const role = params.role || '';

    if (!employeeName) {
      return createAdminResponse(false, 'Employee name is required');
    }

    // Check if employee already exists
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const existingFiles = folder.getFilesByName(sheetName);

    if (existingFiles.hasNext()) {
      return createAdminResponse(false, 'Employee with this name already exists');
    }

    // Create new employee timesheet
    const newSpreadsheet = SpreadsheetApp.create(sheetName);
    const sheet = newSpreadsheet.getSheets()[0];

    // Row 1: Employee Info (special row)
    // Format: EMPLOYEE_INFO | Name | Email | Phone | HireDate | HourlyRate | Role | ClientCode
    sheet.getRange(1, 1).setValue('EMPLOYEE_INFO');
    sheet.getRange(1, 2).setValue(employeeName);
    sheet.getRange(1, 3).setValue(employeeEmail);
    sheet.getRange(1, 4).setValue(employeePhone);
    sheet.getRange(1, 5).setValue(hireDate);
    sheet.getRange(1, 6).setValue(hourlyRate);
    sheet.getRange(1, 7).setValue(role);

    // Row 2: Headers
    // Add Client Code column after Client Name
    sheet.getRange(2, 1, 1, 9).setValues([['Date', 'Start Time', 'End Time', 'Duration (min)', 'Client Name', 'Client Code', 'Task', 'Notes', 'Paid']]);

    // Format header row
    const headerRange = sheet.getRange(2, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#000050');
    headerRange.setFontColor('#FFFFFF');

    // Hide info row
    sheet.hideRows(1);

    // Move the file to the employee folder
    const file = DriveApp.getFileById(newSpreadsheet.getId());
    file.moveTo(folder);

    Logger.log('Created new employee: ' + employeeName);
    return createAdminResponse(true, 'Employee created successfully');
  } catch (error) {
    Logger.log('Error in createEmployee: ' + error.toString());
    return createAdminResponse(false, 'Error creating employee: ' + error.toString());
  }
}

// NEW: Get employee info
function getEmployeeInfo(employeeName) {
  try {
    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const files = folder.getFilesByName(sheetName);

    if (!files.hasNext()) {
      return createAdminResponse(false, 'No timesheet found for this employee');
    }

    const file = files.next();
    const spreadsheet = SpreadsheetApp.open(file);
    const sheet = spreadsheet.getSheets()[0];

    // Check if row 1 contains employee info
    const infoMarker = sheet.getRange(1, 1).getValue();

    if (infoMarker === 'EMPLOYEE_INFO') {
      const employeeInfo = {
        name: sheet.getRange(1, 2).getValue() || employeeName,
        email: sheet.getRange(1, 3).getValue() || '',
        phone: sheet.getRange(1, 4).getValue() || '',
        hireDate: sheet.getRange(1, 5).getValue() || '',
        hourlyRate: sheet.getRange(1, 6).getValue() || '',
        role: sheet.getRange(1, 7).getValue() || ''
      };

      return createAdminResponse(true, 'Employee info loaded', { employeeInfo: employeeInfo });
    } else {
      // No info row exists, return default info
      return createAdminResponse(true, 'Employee info loaded', {
        employeeInfo: {
          name: employeeName,
          email: '',
          phone: '',
          hireDate: '',
          hourlyRate: '',
          role: ''
        }
      });
    }
  } catch (error) {
    Logger.log('Error in getEmployeeInfo: ' + error.toString());
    return createAdminResponse(false, 'Error loading employee info: ' + error.toString());
  }
}

// NEW: Update employee info
function updateEmployeeInfo(params) {
  try {
    const employeeName = params.employeeName;
    const email = params.email || '';
    const phone = params.phone || '';
    const hireDate = params.hireDate || '';
    const hourlyRate = params.hourlyRate || '';
    const role = params.role || '';

    const folder = DriveApp.getFolderById(EMPLOYEE_FOLDER_ID);
    const sheetName = employeeName + ' - Timesheet';
    const files = folder.getFilesByName(sheetName);

    if (!files.hasNext()) {
      return createAdminResponse(false, 'No timesheet found for this employee');
    }

    const file = files.next();
    const spreadsheet = SpreadsheetApp.open(file);
    const sheet = spreadsheet.getSheets()[0];

    // Check if info row exists
    const infoMarker = sheet.getRange(1, 1).getValue();

    if (infoMarker !== 'EMPLOYEE_INFO') {
      // Create info row
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1).setValue('EMPLOYEE_INFO');
      sheet.hideRows(1);
      // Headers are now on row 2, so we need to update them
      const headerRange = sheet.getRange(2, 1, 1, 9);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#000050');
      headerRange.setFontColor('#FFFFFF');
    }

    // Update info
    sheet.getRange(1, 2).setValue(employeeName);
    sheet.getRange(1, 3).setValue(email);
    sheet.getRange(1, 4).setValue(phone);
    sheet.getRange(1, 5).setValue(hireDate);
    sheet.getRange(1, 6).setValue(hourlyRate);
    sheet.getRange(1, 7).setValue(role);

    return createAdminResponse(true, 'Employee info updated');
  } catch (error) {
    Logger.log('Error in updateEmployeeInfo: ' + error.toString());
    return createAdminResponse(false, 'Error updating employee info: ' + error.toString());
  }
}

// ====== RECEIPT MANAGEMENT FUNCTIONS ======

// Get all receipts from Receipts Tracker sheet
function getAllReceipts() {
  try {
    const trackerSheet = getReceiptsTrackerSheet();
    if (!trackerSheet) {
      return createAdminResponse(false, 'Receipts tracker sheet not found');
    }

    const trackerData = trackerSheet.getDataRange().getValues();
    const receipts = [];

    // Skip header row, start from index 1
    for (let i = 1; i < trackerData.length; i++) {
      const row = trackerData[i];

      if (row[0]) { // If date exists, it's a valid receipt
        const receiptInfo = {
          date: row[0] || '',  // Column A - Date
          clientName: row[1] || '',  // Column B - Client Name
          accessCode: row[2] || '',  // Column C - Client Code
          amount: row[3] || '',  // Column D - Amount
          receiptLink: row[4] || '',  // Column E - Receipt Link
          status: row[5] || '',  // Column F - Status (Generated/Receipt Sent/Paid)
          generatedDate: row[6] || '',  // Column G - Generated Timestamp
          sentDate: row[7] || '',  // Column H - Sent Timestamp
          paidDate: row[8] || '',  // Column I - Paid Timestamp
          company: '',
          inReceiptFolder: false,
          receiptFolderPath: ''
        };

        // Check if receipt is in folder (for Paid receipts)
        if (receiptInfo.status === 'Paid') {
          const folderCheck = checkReceiptInFolderInternal(receiptInfo.accessCode);
          if (folderCheck) {
            receiptInfo.inReceiptFolder = folderCheck.inFolder;
            receiptInfo.receiptFolderPath = folderCheck.folderPath || '';
          }
        }

        receipts.push(receiptInfo);
      }
    }

    return createAdminResponse(true, 'Receipts loaded successfully', { receipts: receipts });
  } catch (error) {
    Logger.log('Error in getAllReceipts: ' + error.toString());
    return createAdminResponse(false, 'Error loading receipts: ' + error.toString());
  }
}

// Send receipt to organized folder (year/month)
function sendReceiptToFolder(accessCode) {
  try {
    if (!accessCode) {
      return createAdminResponse(false, 'Access code is required');
    }

    // Get client data
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    let clientData = null;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        clientData = data[i];
        break;
      }
    }

    if (!clientData) {
      return createAdminResponse(false, 'Client not found');
    }

    const receiptLink = clientData[18]; // Column S
    if (!receiptLink) {
      return createAdminResponse(false, 'No receipt found for this client');
    }

    // Extract file ID from receipt link
    const receiptFileId = extractDocId(receiptLink);
    if (!receiptFileId) {
      return createAdminResponse(false, 'Invalid receipt link');
    }

    const clientName = clientData[3] || 'Client';
    const companyName = clientData[4] || '';
    const status = clientData[1] || '';

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];

    // Get or create year/month folder
    const targetFolder = getOrCreateYearMonthFolder(year, month);

    // Get the receipt file
    const receiptFile = DriveApp.getFileById(receiptFileId);

    // Create filename with PAID prefix if status is "Paid"
    const prefix = status === 'Paid' ? 'PAID - ' : '';
    const fileName = prefix + 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';

    // Check if file already exists in target folder
    const existingFiles = targetFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      const folderPath = year + '/' + month;
      return createAdminResponse(true, 'Receipt already in folder', { folderPath: folderPath });
    }

    // Make a copy in the target folder
    const copiedFile = receiptFile.makeCopy(fileName, targetFolder);

    const folderPath = year + '/' + month;
    Logger.log('Receipt sent to folder: ' + folderPath + '/' + fileName);

    return createAdminResponse(true, 'Receipt sent to folder successfully', { folderPath: folderPath });
  } catch (error) {
    Logger.log('Error in sendReceiptToFolder: ' + error.toString());
    return createAdminResponse(false, 'Error sending receipt to folder: ' + error.toString());
  }
}

// Check if receipt is in folder
function checkReceiptInFolder(accessCode) {
  try {
    const result = checkReceiptInFolderInternal(accessCode);
    if (result) {
      return createAdminResponse(true, 'Receipt status checked', result);
    } else {
      return createAdminResponse(false, 'Could not check receipt status');
    }
  } catch (error) {
    Logger.log('Error in checkReceiptInFolder: ' + error.toString());
    return createAdminResponse(false, 'Error checking receipt status: ' + error.toString());
  }
}

// Internal helper to check if receipt is in folder
function checkReceiptInFolderInternal(accessCode) {
  try {
    // Get client data
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    let clientData = null;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][15]) === String(accessCode)) {
        clientData = data[i];
        break;
      }
    }

    if (!clientData || !clientData[18]) {
      return { inFolder: false, folderPath: '' };
    }

    const clientName = clientData[3] || 'Client';
    const companyName = clientData[4] || '';
    const status = clientData[1] || '';

    // Search in all year/month folders
    const parentFolder = DriveApp.getFolderById(YEARLY_RECEIPTS_FOLDER_ID);
    const yearFolders = parentFolder.getFolders();

    while (yearFolders.hasNext()) {
      const yearFolder = yearFolders.next();
      const monthFolders = yearFolder.getFolders();

      while (monthFolders.hasNext()) {
        const monthFolder = monthFolders.next();

        // Check for files with and without PAID prefix
        const fileName1 = 'Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';
        const fileName2 = 'PAID - Receipt - ' + clientName + (companyName ? ' - ' + companyName : '') + '.pdf';

        const files1 = monthFolder.getFilesByName(fileName1);
        const files2 = monthFolder.getFilesByName(fileName2);

        if (files1.hasNext() || files2.hasNext()) {
          const folderPath = yearFolder.getName() + '/' + monthFolder.getName();
          return { inFolder: true, folderPath: folderPath };
        }
      }
    }

    return { inFolder: false, folderPath: '' };
  } catch (error) {
    Logger.log('Error in checkReceiptInFolderInternal: ' + error.toString());
    return { inFolder: false, folderPath: '' };
  }
}

// Get or create year/month folder in receipt folder
function getOrCreateYearMonthFolder(year, month) {
  try {
    const parentFolder = DriveApp.getFolderById(YEARLY_RECEIPTS_FOLDER_ID);
    const yearString = String(year);

    // Get or create year folder
    let yearFolder = null;
    const yearFolders = parentFolder.getFoldersByName(yearString);

    if (yearFolders.hasNext()) {
      yearFolder = yearFolders.next();
    } else {
      yearFolder = parentFolder.createFolder(yearString);
      Logger.log('Created year folder: ' + yearString);
    }

    // Get or create month folder
    let monthFolder = null;
    const monthFolders = yearFolder.getFoldersByName(month);

    if (monthFolders.hasNext()) {
      monthFolder = monthFolders.next();
    } else {
      monthFolder = yearFolder.createFolder(month);
      Logger.log('Created month folder: ' + month + ' in year ' + yearString);
    }

    return monthFolder;
  } catch (error) {
    Logger.log('Error in getOrCreateYearMonthFolder: ' + error.toString());
    throw error;
  }
}


// ========== SPREADSHEET MENU (when bound to Master sheet) ==========

// FINAL FULL SCRIPT â€” ESTIMATION, SENDING & APPROVAL FLOW WITH 'Estimation' + 'Quote' SHEETS

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Actions')
    .addItem('ðŸ§® Generate Estimation', 'triggerEstimation')
    .addItem('âœ… Approve First Estimate', 'approveThisEstimate')
    .addItem('ðŸ“‹ Approve All Estimates', 'approveAllEstimates')
    .addItem('ðŸ“¤ Send Quote to Client', 'sendQuoteToClient')
    .addItem('ðŸŽ‰ Client Approved', 'clientApprovedQuote')
    .addItem('ðŸ—‚ï¸ Update Revisions', 'updateRevisionLinksFromServiceFolder')
    .addItem('ðŸ§¾ Send Receipt', 'sendReceiptToClient')
    .addItem('ðŸ’µ Paid Selected Row', 'markActiveRowAsPaid')
    .addSeparator()
    .addItem('ðŸ™ˆ Hide Paid Rows', 'hidePaidRows')
    .addItem('ðŸ‘€ Show Paid Rows', 'showPaidRows')
    .addToUi();
}



function triggerEstimation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const master = ss.getSheetByName("Master");
  const rows = master.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cost = row[9];
    const price = row[10];
    const driveUrl = row[11];
    const briefUrl = row[12];
    const service = row[8];

    if (!cost && !price && driveUrl && briefUrl && service) {
      const clientName = row[3];
      const company = row[4];
      const rowIndex = i + 1;
      try {
        estimateFromQuoteSheet(clientName, company, service, driveUrl, briefUrl, master, rowIndex);
      } catch (err) {
        Logger.log("Estimation Error: " + err);
      }
    }
  }
}

function parseStickerBrief(briefText) {
  const stickerRegex = /Sticker (\d+):\s*([\s\S]*?)(?=\n\s*Sticker \d+:|$)/gi;
  const stickers = [];
  let match;
  while ((match = stickerRegex.exec(briefText)) !== null) {
    const section = match[2];
    const sticker = {};
    section.split(/\n|,/).forEach(line => {
      const [key, value] = line.split(/[:=]/).map(s => s.trim());
      if (key && value !== undefined) {
        sticker[key.toLowerCase()] = value;
      }
    });
    stickers.push(sticker);
  }
  return stickers;
}

function getLogoConditions(answers) {
  const conditions = [];

  const hasLogoFiles = answers.HasLogoFiles?.toLowerCase() === 'yes';
  const preferencesText = (answers.DesignPreferences || "").toLowerCase();
  const generalComments = (answers.Comments || "").toLowerCase();
  const allText = preferencesText + " " + generalComments;

  const preferencesCount = preferencesText.split(/[\s,.;]+/).filter(w => w).length;

  const wantsSocial = Array.isArray(answers.SocialPlatforms) && answers.SocialPlatforms.length > 0;
  const hasSlogan = !!answers.Slogan;
  const hasColorPrefs = !!answers.ColorPreferences;
  const wantsIcon = !!answers.ImageInMind;
  const wantsMultipleLogos = answers.MultipleLogoConcepts === 'yes';
  const wantsRevisions = answers.RevisionRounds && parseInt(answers.RevisionRounds) > 1;

  const revampKeywords = [
    'revamp', 'redo', 'refaire', 'rafraÃ®chir', 'rafraichir', 'moderniser',
    'rebranding', 'mise Ã  jour', 'mise a jour', 'rafraichissement', 'remise Ã  jour',
    'update', 'modifier logo', 'revoir le logo', 'retravail', 'ajustement', 'amÃ©liorer le logo',
    'amÃ©liorer', 'amÃ©lioration du logo', 'rÃ©vision'
  ];

  const isRevamp = revampKeywords.some(keyword => allText.includes(keyword));
  const isSimple = hasLogoFiles && preferencesCount <= 3 && !wantsSocial && !hasSlogan && !hasColorPrefs;

  if (isSimple || isRevamp) {
    conditions.push('package:basic');
  } else {
    conditions.push('package:complete');
  }

  if (wantsRevisions) {
    conditions.push('extra:revision');
  }
  if (wantsMultipleLogos) {
    conditions.push('extra:logo');
  }
  if (wantsIcon) {
    conditions.push('extra:icon');
  }

  return conditions;
}

function extractAnswersFromBrief(briefText) {
  const lines = briefText.split('\n');
  const answers = {};

  lines.forEach(line => {
    const parts = line.split(/[:=]/);
    if (parts.length >= 2) {
      const key = parts[0].trim().replace(/\s+/g, '');
      const value = parts.slice(1).join(':').trim();
      if (key) answers[key] = value;
    }
  });

  return answers;
}



function parseBrief(briefText) {
  const answers = extractAnswersFromBrief(briefText);
  const normalized = {};
  for (const key in answers) {
    const k = String(key).toLowerCase().replace(/\s+/g, '');
    if (k) normalized[k] = answers[key];
  }
  return normalized;
}
function estimateFromQuoteSheet(clientName, companyName, service, driveUrl, briefUrl, masterSheet, rowIndex) {
  const briefText = DocumentApp.openByUrl(briefUrl).getBody().getText();
  const isNewClient = /NewClient\s*[:=]\s*yes/i.test(briefText);
  const quoteSheetId = "16Ry5BQW33WqEHf9ZWymVOWIjj7fV49EUOxA4riKgSXA";
  const spreadsheet = SpreadsheetApp.openById(quoteSheetId);
  const quoteSheet = spreadsheet.getSheetByName(service);
  if (!quoteSheet) throw new Error(`Quote sheet for service '${service}' not found.`);

  const data = quoteSheet.getDataRange().getValues();
  const matchedRows = [];

  if (service === 'stickers') {
    const stickers = parseStickerBrief(briefText);

    stickers.forEach((s, index) => {
      const shape = s["preferredshape"];
      const lamination = s["lamination"];
      const height = parseFloat(s["stickerheight"]);
      const width = parseFloat(s["stickerwidth"]);
      const quantity = parseInt(s["quantity"]);

      let targetItem = "";
      if (shape === "print-cut" && lamination === "no-lamination") {
        targetItem = "Vinyl Paper wo/ Laminate";
      } else if (shape === "print-cut" && lamination === "laminated") {
        targetItem = "Vinyl Paper w/ Laminate";
      } else if (shape === "cut-only" && (lamination === "no-lamination" || lamination === "laminated")) {
        targetItem = "Black Gloss Cut Only";
      }
      if (!targetItem) return;

      const match = data.find(row => row[0] === targetItem);
      if (!match) return;

      const unitCost = parseFloat(match[2]);
      const unitPrice = parseFloat(match[3]);
      const area = height * width;
      const totalCost = unitCost * area * quantity;
      const totalPrice = unitPrice * area * quantity;

      const label = `Sticker ${index + 1} - ${targetItem}`;
      matchedRows.push([label, quantity, totalCost, totalPrice]);
    });
  }
  else if (service === 'boat-lettering') {
    const conditionsSet = new Set(
      briefText
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.includes(':'))
    );

    for (let i = 1; i < data.length; i++) {
      const [label, condition, cost, price] = data[i];
      if (!label || !condition || !price) continue;

      const normalizedCondition = condition.toString().trim().toLowerCase();

      if (normalizedCondition === "" || conditionsSet.has(normalizedCondition)) {
        const quantity = 1;
        const unitCost = parseFloat(cost) || 0;
        const unitPrice = parseFloat(price);
        const totalCost = unitCost * quantity;
        const totalPrice = unitPrice * quantity;

        matchedRows.push([label, quantity, totalCost, totalPrice]);
      }
    }
  }
  else if (service === 'logo-design') {
    const normalizedBrief = parseBrief(briefText); // Your existing helper
    const hasLogoFiles = (normalizedBrief["haslogofiles"] || "").toLowerCase();
    const imageInMind = normalizedBrief["imageinmind"];
    const extraInfo = (normalizedBrief["additionalinfo"] || "").toLowerCase();
    const lang = (normalizedBrief["language"] || "en").toLowerCase();

    let packageItem = "", description = "", cost = 0, price = 0;
    const isRedo = /(redo|revamp|refaire|rebrand|ancien logo|retravail)/i.test(extraInfo);

    if (isRedo) {
      packageItem = lang === 'fr' ? "Forfait logo â€” RÃ©vision" : "Logo Package â€” Redesign";
      cost = 75; price = 300;
      description = lang === 'fr'
        ? "- 1 concept de logo\n- 1 ronde de rÃ©vision\n- Fichiers finaux : JPG, PNG, PDF\n- Versions noir/blanc et transparentes"
        : "- 1 logo concept\n- 1 revision round\n- Final files: JPG, PNG, PDF\n- Black/white and transparent versions";
    } else if (isNewClient || hasLogoFiles === "no" || imageInMind) {
      packageItem = lang === 'fr' ? "Forfait logo â€” Branding Complet" : "Logo Package â€” Full Branding";
      cost = 125; price = 500;
      description = lang === 'fr'
        ? "- 2 concepts de logo\n- 2 rondes de rÃ©vision\n- Palette de couleurs (Pantone)\n- Polices (avec fichiers)\n- Fichiers finaux : JPG, PNG, PDF, SVG, CDR, AI\n- Versions noir/blanc, transparentes et rÃ©seaux sociaux"
        : "- 2 logo concepts\n- 2 revision rounds\n- Color palette (Pantone)\n- Fonts (with files)\n- Final files: JPG, PNG, PDF, SVG, CDR, AI\n- Black/white, transparent & social media versions";
    } else {
      packageItem = lang === 'fr' ? "Forfait logo â€” De base" : "Logo Package â€” Basic";
      cost = 75; price = 300;
      description = lang === 'fr'
        ? "- 1 concept de logo\n- 1 ronde de rÃ©vision\n- Fichiers finaux : JPG, PNG, PDF\n- Versions noir/blanc et transparentes"
        : "- 1 logo concept\n- 1 revision round\n- Final files: JPG, PNG, PDF\n- Black/white and transparent versions";
    }

    matchedRows.push([packageItem, 1, cost, price]);
    matchedRows.push([description, "", "", ""]);

    if (/extra|concept/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "Concept supplÃ©mentaire" : "Extra Logo Concept", 1, 25, 100]);
    }
    if (/icon|icÃ´ne/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "Conception dâ€™icÃ´ne" : "Custom Icon Design", 1, 10, 40]);
    }
    if (/revision|rÃ©vision|modif/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "RÃ©vision additionnelle" : "Additional Revision", 1, 10, 30]);
    }
  }

  if (matchedRows.length === 0) throw new Error("No matching items found.");

  // Create the estimate file in the client's service folder
  const folderId = driveUrl.match(/[-\w]{25,}/)[0];
  const serviceFolder = DriveApp.getFolderById(folderId);
  const estimateSpreadsheet = SpreadsheetApp.create("Estimate Ready");
  DriveApp.getFileById(estimateSpreadsheet.getId()).moveTo(serviceFolder);

  // Build Estimation sheet
  const sheetEstimate = estimateSpreadsheet.getSheets()[0];
  sheetEstimate.setName("Estimation");
  sheetEstimate.clear();
  sheetEstimate.getRange(1, 1, 1, 5).setValues([["Items", "Quantity", "Cost", "Price", "Profit"]]);
  sheetEstimate.getRange(1, 1, 1, 5).setFontWeight("bold");

  for (let i = 0; i < matchedRows.length; i++) {
    const [item, quantity, cost, price] = matchedRows[i];
    sheetEstimate.getRange(i + 2, 1).setValue(item);
    sheetEstimate.getRange(i + 2, 2).setValue(quantity);
    sheetEstimate.getRange(i + 2, 3).setValue(cost);
    sheetEstimate.getRange(i + 2, 4).setValue(price);
    if (!isNaN(price) && !isNaN(cost)) {
      sheetEstimate.getRange(i + 2, 5).setFormula(`=D${i + 2}-C${i + 2}`);
    }
  }

  const totalRow = matchedRows.length + 2;
  sheetEstimate.getRange(totalRow, 1).setValue("TOTAL").setFontWeight("bold");
  sheetEstimate.getRange(totalRow, 3).setFormula(`=SUM(C2:C${totalRow - 1})`).setFontWeight("bold");
  sheetEstimate.getRange(totalRow, 4).setFormula(`=SUM(D2:D${totalRow - 1})`).setFontWeight("bold");
  sheetEstimate.getRange(totalRow, 5).setFormula(`=SUM(E2:E${totalRow - 1})`).setFontWeight("bold");
  sheetEstimate.getRange(`C2:E${totalRow}`).setNumberFormat("$#,##0.00");

  // Build Quote sheet
  const clientQuoteSheet = estimateSpreadsheet.insertSheet("Quote");
  clientQuoteSheet.getRange(1, 1, 1, 3).setValues([["Items", "Quantity", "Price"]]);
  clientQuoteSheet.getRange(1, 1, 1, 3).setFontWeight("bold");

  for (let i = 0; i < matchedRows.length; i++) {
    clientQuoteSheet.getRange(i + 2, 1).setFormula(`=Estimation!A${i + 2}`);
    clientQuoteSheet.getRange(i + 2, 2).setFormula(`=Estimation!B${i + 2}`);
    clientQuoteSheet.getRange(i + 2, 3).setFormula(`=Estimation!D${i + 2}`);
  }

  clientQuoteSheet.getRange(matchedRows.length + 2, 1).setValue("TOTAL").setFontWeight("bold");
  clientQuoteSheet.getRange(matchedRows.length + 2, 3).setFormula(`=SUM(C2:C${matchedRows.length + 1})`).setFontWeight("bold");
  clientQuoteSheet.getRange(`C2:C${matchedRows.length + 2}`).setNumberFormat("$#,##0.00");

  // Save the fileId on Master and set status
  const fileId = estimateSpreadsheet.getId();
  masterSheet.getRange(rowIndex, 14).setValue(fileId); // Column N
  masterSheet.getRange(rowIndex, 2).setValue("Estimate Ready"); // Column B

  // ===== CHANGES BELOW: Dynamic J/K with live IMPORTRANGE inside HYPERLINK =====
  const linkUrl = `https://docs.google.com/spreadsheets/d/${fileId}`;
  const costA1  = `Estimation!C${totalRow}`; // total cost cell
  const priceA1 = `Estimation!D${totalRow}`; // total price cell

  // Column J (10): Cost â€” hyperlink text is live from the Estimation total
  masterSheet.getRange(rowIndex, 10).setFormula(
    `=HYPERLINK("${linkUrl}", "$"&TEXT(IMPORTRANGE("${fileId}","${costA1}"), "#,##0.00"))`
  );

  // Column K (11): Price â€” hyperlink text is live from the Estimation total
  masterSheet.getRange(rowIndex, 11).setFormula(
    `=HYPERLINK("${linkUrl}", "$"&TEXT(IMPORTRANGE("${fileId}","${priceA1}"), "#,##0.00"))`
  );

  // Prime IMPORTRANGE authorization (one-time per source spreadsheet)
  const primeCell = masterSheet.getRange("ZZ1"); // any unused cell
  primeCell.setFormula(`=IMPORTRANGE("${fileId}","Estimation!A1")`);
  SpreadsheetApp.flush();
  // (Optional) Clear the primer after you click "Allow access" once in the UI:
  // primeCell.clearContent();
}



// Approves the first Estimate Ready entry
function approveThisEstimate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === "Estimate Ready" && data[i][13]) {
      const estimateSheet = SpreadsheetApp.openById(data[i][13]);
      estimateSheet.rename("Estimate Approved");
      sheet.getRange(i + 1, 2).setValue("Estimate Approved");
      break;
    }
  }
}

// Approves all Estimate Ready entries
function approveAllEstimates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === "Estimate Ready" && data[i][13]) {
      const estimateSheet = SpreadsheetApp.openById(data[i][13]);
      estimateSheet.rename("Estimate Approved");
      sheet.getRange(i + 1, 2).setValue("Estimate Approved");
    }
  }
}

// Sends all Estimate Approved entries to clients
function sendQuoteToClient() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  const PDF_COL = 18; // Column R

  for (let i = 1; i < data.length; i++) {
    const status = data[i][1];
    if (status !== "Estimate Approved") continue; // âœ… Only process approved rows

    const clientName = data[i][3];
    const clientEmail = data[i][5];
    const language = (data[i][7] || "").toLowerCase();
    const service = data[i][8];
    const serviceFolderUrl = data[i][11];
    const fileId = data[i][13];
    const accessCode = data[i][15];

    if (!fileId) {
      Logger.log(`Missing fileId at row ${i + 1}, skipping.`);
      continue; // âœ… Prevent invalid argument error
    }

    const folderId = serviceFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!folderId) {
      Logger.log(`Invalid folder URL at row ${i + 1}, skipping.`);
      continue;
    }

    const QUOTE_TEMPLATE_ID = ["fr", "french", "franÃ§ais"].includes(language)
      ? "1ARtgQL2YG5vgMsDqX5a7_zSQy8jTlFWfn_bbYp-6BrY"
      : "1qArSmTeLy6C62KZSWxqM2oGWN-JzkzSFnsgj-HHJ-Vo";

    const estimateFile = SpreadsheetApp.openById(fileId);
    const quoteSheet = estimateFile.getSheetByName("Quote");
    if (!quoteSheet) {
      Logger.log(`Missing 'Quote' sheet in estimate at row ${i + 1}, skipping.`);
      continue;
    }

    const rawValues = quoteSheet.getRange(2, 1, 20, 3).getValues();
    const skipKeywords = ["subtotal", "total", "tax", "note", "comment", "remarque", "total gÃ©nÃ©ral"];
    const quoteValues = rawValues.filter(row => {
      const [desc, qty, price] = row;
      const isKeyword = desc && typeof desc === "string" && skipKeywords.some(k => desc.toLowerCase().includes(k));
      return desc && !isKeyword && typeof qty === "number" && typeof price === "number";
    }).slice(0, 9);

    let subtotal = 0;
    quoteValues.forEach(([, qty, price]) => subtotal += qty * price);
    const total = subtotal;

    const templateFile = DriveApp.getFileById(QUOTE_TEMPLATE_ID);
    const clientFolder = DriveApp.getFolderById(folderId);
    const copy = templateFile.makeCopy(`Quote - ${clientName}`, clientFolder);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    body.replaceText("{{client_name}}", clientName);
    body.replaceText("{{client_email}}", clientEmail);
    body.replaceText("{{receipt_id}}", `Q-${fileId.slice(-5)}`);
    body.replaceText("{{issue_date}}", today);
    body.replaceText("{{service_name}}", service);
    body.replaceText("{{subtotal}}", `$${subtotal.toFixed(2)}`);
    body.replaceText("{{tax}}", "");
    body.replaceText("{{total}}", `$${total.toFixed(2)}`);

    for (let j = 0; j < 9; j++) {
      const [desc, qty, price] = quoteValues[j] || ["", "", ""];
      const amount = qty && price ? (qty * price).toFixed(2) : "";
      body.replaceText(`{{qty_${j + 1}}}`, qty || "");
      body.replaceText(`{{desc_${j + 1}}}`, desc || "");
      body.replaceText(`{{price_${j + 1}}}`, price ? `$${price.toFixed(2)}` : "");
      body.replaceText(`{{amount_${j + 1}}}`, amount ? `$${amount}` : "");
    }

    doc.saveAndClose();

    const pdf = DriveApp.getFileById(copy.getId()).getAs("application/pdf").setName(`Quote - ${clientName}.pdf`);
    const pdfFile = clientFolder.createFile(pdf);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const pdfUrl = pdfFile.getUrl();

    sheet.getRange(i + 1, PDF_COL).setValue(pdfUrl);

    try {
      estimateFile.rename("Quote Sent");
    } catch (e) {
      Logger.log(`Rename failed for row ${i + 1}: ${e}`);
    }

    const acceptUrl = `https://script.google.com/macros/s/AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g/exec?action=acceptEmail&email=${encodeURIComponent(clientEmail)}&accessCode=${encodeURIComponent(accessCode)}`;
    const dashboardUrl = `https://clients.heavydetailing.com/?email=${encodeURIComponent(clientEmail)}&code=${encodeURIComponent(accessCode)}`;

    const buttonStyle = `
      display: inline-block;
      padding: 12px 24px;
      font-weight: bold;
      border-radius: 6px;
      text-decoration: none;
      font-family: sans-serif;
      margin: 10px 0;
    `;
    const greenButton = `${buttonStyle} background-color: #4CAF50; color: white;`;
    const blueButton = `${buttonStyle} background-color: #000050; color: white;`;

    let subject, htmlBody;
    if (["fr", "french", "franÃ§ais"].includes(language)) {
      subject = `Votre soumission de Heavy D â€” ${service}`;
      htmlBody = `
        Bonjour ${clientName},<br><br>
        Voici votre soumission pour le service <b>${service}</b>.<br>
        Veuillez consulter le PDF ci-joint.<br><br>

        âœ… Cliquez ci-dessous pour accepter votre soumission :<br>
        <a href="${acceptUrl}" style="${greenButton}">Accepter la soumission</a><br><br>

        ðŸ—‚ï¸ AccÃ©dez Ã  votre tableau de bord personnalisÃ© pour voir tous vos designs futurs :<br>
        <a href="${dashboardUrl}" style="${blueButton}">Aller au tableau de bord</a><br><br>

        Votre code d'accÃ¨s : <b>${accessCode}</b><br><br>

        Merci !<br>
        <b>Lâ€™Ã©quipe Heavy D</b>
      `;
    } else {
      subject = `Your Quote from Heavy D â€” ${service}`;
      htmlBody = `
        Hi ${clientName},<br><br>
        Here is your quote for the service <b>${service}</b>.<br>
        Please find the attached PDF.<br><br>

        âœ… Click below to accept your quote:<br>
        <a href="${acceptUrl}" style="${greenButton}">Accept Quote</a><br><br>

        ðŸ—‚ï¸ You can also access your personal dashboard to view all future designs:<br>
        <a href="${dashboardUrl}" style="${blueButton}">Go to My Dashboard</a><br><br>

        Your access code: <b>${accessCode}</b><br><br>

        Thank you!<br>
        <b>Heavy D Print & Design</b>
      `;
    }

    GmailApp.sendEmail(clientEmail, subject, '', {
      htmlBody: htmlBody,
      attachments: [pdf]
    });

    sheet.getRange(i + 1, 2).setValue("Quote Sent"); // âœ… Update status
  }
}


function sendReceiptToClient() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();

  const RECEIPT_TEMPLATE_EN = "1LPqKMOwvT4GKjhRJl8A0pNX-tFS7A78TL7ovkDwrZxQ";
  const RECEIPT_TEMPLATE_FR = "1sM3cgM_llLtCaNzxkxxdKBL6GEV1gjdBkXxSwUnE_2o";
  const PDF_COL = 19; // Column S

  for (let i = 1; i < data.length; i++) {
    const status = data[i][1];
    const clientName = data[i][3];
    const clientEmail = data[i][5];
    const language = (data[i][7] || "").toLowerCase();
    const service = data[i][8];
    const serviceFolderUrl = data[i][11];
    const fileId = data[i][13];
    const accessCode = data[i][15];

    if (status !== "Completed" || !clientEmail || !accessCode || !serviceFolderUrl || !fileId || data[i][PDF_COL]) continue;

    const folderId = serviceFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!folderId) continue;

    const estimateFile = SpreadsheetApp.openById(fileId);
    const quoteSheet = estimateFile.getSheetByName("Quote");
    if (!quoteSheet) continue;

    const rawValues = quoteSheet.getRange(2, 1, 20, 3).getValues();
    const skipKeywords = ["subtotal", "total", "tax", "note", "comment", "remarque", "total gÃ©nÃ©ral"];

    const quoteValues = (rawValues || []).filter(row => {
      if (!Array.isArray(row)) return false;
      const [desc, qty, price] = row;
      if (!desc || typeof desc !== "string") return false;
      const isKeyword = skipKeywords.some(k => desc.toLowerCase().includes(k));
      const validQty = typeof qty === 'number' && !isNaN(qty);
      const validPrice = typeof price === 'number' && !isNaN(price);
      return !isKeyword && validQty && validPrice;
    }).slice(0, 9);

    let subtotal = 0;
    for (let j = 0; j < quoteValues.length; j++) {
      const [, qty, price] = quoteValues[j];
      if (!isNaN(qty) && !isNaN(price)) {
        subtotal += qty * price;
      }
    }

    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
    const tax = tps + tvq;
    const total = subtotal + tax;

    const templateId = ["fr", "french", "franÃ§ais"].includes(language) ? RECEIPT_TEMPLATE_FR : RECEIPT_TEMPLATE_EN;
    const templateFile = DriveApp.getFileById(templateId);
    const clientFolder = DriveApp.getFolderById(folderId);
    
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyMMdd");
    const receiptId = `R-${today}-${i + 1}`;
    const fileName = `${receiptId}-SENT`;

    const copy = templateFile.makeCopy(fileName, clientFolder);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();

    body.replaceText("{{client_name}}", clientName);
    body.replaceText("{{client_email}}", clientEmail);
    body.replaceText("{{receipt_id}}", receiptId);
    body.replaceText("{{issue_date}}", Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));
    body.replaceText("{{service_name}}", service);
    body.replaceText("{{subtotal}}", `$${subtotal.toFixed(2)}`);
    body.replaceText("{{tax}}", `$${tax.toFixed(2)}`);
    body.replaceText("{{total}}", `$${total.toFixed(2)}`);

    for (let j = 0; j < 9; j++) {
      const [desc, qty, price] = quoteValues[j] || ["", "", ""];
      const amount = (qty && price) ? (qty * price).toFixed(2) : "";
      body.replaceText(`{{qty_${j + 1}}}`, qty || "");
      body.replaceText(`{{desc_${j + 1}}}`, desc || "");
      body.replaceText(`{{price_${j + 1}}}`, price ? `$${price.toFixed(2)}` : "");
      body.replaceText(`{{amount_${j + 1}}}`, amount ? `$${amount}` : "");
    }

    doc.saveAndClose();
    const pdf = DriveApp.getFileById(copy.getId()).getAs("application/pdf").setName(`${fileName}.pdf`);
    const pdfFile = clientFolder.createFile(pdf);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const pdfUrl = pdfFile.getUrl();

    sheet.getRange(i + 1, PDF_COL).setValue(pdfUrl);
    sheet.getRange(i + 1, 2).setValue("Receipt Sent");

    const subject = ["fr", "french", "franÃ§ais"].includes(language)
      ? `Votre reÃ§u de Heavy D â€” ${service}`
      : `Your Receipt from Heavy D â€” ${service}`;

    const bodyText = ["fr", "french", "franÃ§ais"].includes(language)
      ? `Bonjour ${clientName},<br><br>Voici votre reÃ§u pour le service <b>${service}</b>.<br>Veuillez consulter le PDF ci-joint.<br><br>Merci pour votre confiance!<br><b>L'Ã©quipe Heavy D</b>`
      : `Hi ${clientName},<br><br>Here is your receipt for the service <b>${service}</b>.<br>Please find the attached PDF.<br><br>Thank you for your business!<br><b>Heavy D Print & Design</b>`;

    GmailApp.sendEmail(clientEmail, subject, '', {
      htmlBody: bodyText,
      attachments: [pdf]
    });

  }
}


function sendQuoteToV0(rowIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  const clientName = row[3];
  const companyName = row[4];
  const service = row[8];
  const spreadsheetId = row[13]; // Column N
  const email = row[5];
  const accessCode = row[15];

  const estimateSpreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const quoteSheet = estimateSpreadsheet.getSheetByName("Quote");

  const quoteData = quoteSheet.getRange(2, 1, quoteSheet.getLastRow() - 2, 3).getValues(); // A2:C
  const quoteItems = [];

  for (let i = 0; i < quoteData.length; i++) {
    const [item, quantity, price] = quoteData[i];
    if (item === "TOTAL" || !item) break;
    quoteItems.push({ item, quantity, price });
  }

  const totalPrice = quoteSheet.getRange(`C${quoteItems.length + 2}`).getValue();

  const payload = {
    clientName,
    companyName,
    service,
    email,
    accessCode,
    totalPrice,
    quoteItems
  };

  // POST to V0 Webhook (replace with your endpoint)
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch("https://your-v0-endpoint.com/api/quote", options);
  Logger.log(response.getContentText());
}

// Handles when client accepts the quote
function clientApprovedQuote() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const status = data[i][1];
    const fileId = data[i][13];
    if (status === "Quote Sent" && fileId) {
      const file = SpreadsheetApp.openById(fileId);
      file.rename("Quote Accepted");
      sheet.getRange(i + 1, 2).setValue("Quote Accepted");
    }
  }
}

function handleAcceptEmail(e) {
  const email = e.parameter.email;
  const accessCode = e.parameter.accessCode;
  const masterSheet = SpreadsheetApp.openById("1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU").getSheetByName("Master");

  if (!email || !accessCode) {
    return HtmlService.createHtmlOutput("Missing email or access code.");
  }

  const data = masterSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][5];
    const rowCode = String(data[i][15]);
    const status = data[i][1];
    const fileId = data[i][13];

    if (rowEmail === email && rowCode === accessCode && fileId) {
      // âœ… Only allow update if status is "Quote Sent"
      if (status !== "Quote Sent") {
        return HtmlService.createHtmlOutput("This quote has already been accepted or processed.");
      }

      // Update status
      masterSheet.getRange(i + 1, 2).setValue("Quote Accepted");

      // Rename file
      try {
        const estimateFile = DriveApp.getFileById(fileId);
        estimateFile.setName("Quote Accepted");
      } catch (err) {
        console.warn("Could not rename file:", err.message);
      }

      // Redirect to dashboard
      const redirectUrl = `https://clients.heavydetailing.com/quote-accepted?email=${encodeURIComponent(email)}&accessCode=${encodeURIComponent(accessCode)}`;
      return HtmlService.createHtmlOutput(`<script>window.location.href="${redirectUrl}";</script><p>Redirecting...</p>`);
    }
  }

  return HtmlService.createHtmlOutput("We couldn't find your quote. Please double-check your email and access code.");
}

function markActiveRowAsPaid() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ADMIN_CONFIG.CLIENTS_SHEET);
  const row = sheet.getActiveRange().getRow();
  markAsPaid(row);
}

function markAsPaid(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ADMIN_CONFIG.CLIENTS_SHEET);
  const row = parseInt(rowNumber);

  if (isNaN(row) || row < 2) {
    throw new Error("Invalid row number");
  }

  const url = sheet.getRange(row, 19).getValue(); // Column S (19)
  const oldFileId = extractFileIdFromUrl(url);
  const oldFile = DriveApp.getFileById(oldFileId);

  const newName = oldFile.getName().replace("-SENT", "-PAID");
  oldFile.setName(newName);

  // Update column B (2) to Paid and column S (19) URL
  sheet.getRange(row, 2).setValue("Paid");
  const newUrl = url.replace("-SENT", "-PAID");
  sheet.getRange(row, 19).setValue(newUrl);

  // Handle folder copy
  const year = new Date().getFullYear().toString();
  const receiptFolder = getOrCreateYearFolder(ADMIN_CONFIG.RECEIPT_ROOT_FOLDER_ID, year);
  oldFile.makeCopy(newName, receiptFolder);

  SpreadsheetApp.flush();
}

function extractFileIdFromUrl(url) {
  const match = url.match(/[-\w]{25,}/);
  if (!match) throw new Error("Invalid URL - Cannot extract file ID");
  return match[0];
}

function getOrCreateYearFolder(parentId, year) {
  const parentFolder = DriveApp.getFolderById(parentId);
  const folders = parentFolder.getFoldersByName(year);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(year);
}

// Hides every row in "Master" where Status (col B) is exactly "Completed"
function hideCompletedRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  if (!sheet) throw new Error('Sheet "Master" not found.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // nothing to do

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const STATUS_COL_INDEX = 1; // zero-based in "data" (Column B)

  // Build contiguous spans of rows to hide for performance
  let spans = [];
  let start = null;
  for (let r = 2; r <= lastRow; r++) { // skip header (row 1)
    const status = (data[r - 1][STATUS_COL_INDEX] || "").toString().trim();
    const isCompleted = status === "Completed";
    const alreadyHidden = sheet.isRowHiddenByUser(r);

    if (isCompleted && !alreadyHidden) {
      if (start === null) start = r;
    } else if (start !== null) {
      spans.push([start, r - start]);
      start = null;
    }
  }
  if (start !== null) {
    spans.push([start, lastRow - start + 1]);
  }

  // Apply hides
  spans.forEach(([row, num]) => sheet.hideRows(row, num));
}

// Shows back every row in "Master" where Status (col B) is "Completed"
// Hides every row in "Master" where Status (col B) is exactly "Paid"
function hidePaidRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  if (!sheet) throw new Error('Sheet "Master" not found.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // only header

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const STATUS_COL_INDEX = 1; // Column B in 0-based array

  let spans = [];
  let start = null;
  for (let r = 2; r <= lastRow; r++) { // skip header
    const status = (data[r - 1][STATUS_COL_INDEX] || "").toString().trim();
    const isPaid = status === "Paid";
    const alreadyHidden = sheet.isRowHiddenByUser(r);

    if (isPaid && !alreadyHidden) {
      if (start === null) start = r;
    } else if (start !== null) {
      spans.push([start, r - start]);
      start = null;
    }
  }
  if (start !== null) {
    spans.push([start, lastRow - start + 1]);
  }

  spans.forEach(([row, num]) => sheet.hideRows(row, num));
}

// Shows every row in "Master" where Status (col B) is "Paid"
function showPaidRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  if (!sheet) throw new Error('Sheet "Master" not found.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const STATUS_COL_INDEX = 1; // Column B

  let spans = [];
  let start = null;
  for (let r = 2; r <= lastRow; r++) {
    const status = (data[r - 1][STATUS_COL_INDEX] || "").toString().trim();
    const isPaid = status === "Paid";
    const hidden = sheet.isRowHiddenByUser(r);

    if (isPaid && hidden) {
      if (start === null) start = r;
    } else if (start !== null) {
      spans.push([start, r - start]);
      start = null;
    }
  }
  if (start !== null) {
    spans.push([start, lastRow - start + 1]);
  }

  spans.forEach(([row, num]) => sheet.showRows(row, num));
}

// ========== ONE PROJECT ==========
// When all .gs files are in the same project, main.gs routes Admin Panel requests here
// via ?api=admin (GET) or body.api=admin (POST). No separate deployment needed.
