/**
 * Heavy D Print & Design - Client Dashboard Backend (Updated for Master Sheet)
 * Google Apps Script with enhanced debugging and GET support for quote acceptance
 */

// Configuration - Updated for Master sheet
const CONFIG = {
  CLIENTS_SHEET: 'Master',
  COMMENTS_SHEET: 'Comments',
  QUOTE_SHEET: 'Quote',
  NOTIFICATION_EMAIL: 'info@heavydetailing.com',
  BUSINESS_NAME: 'Heavy D Print & Design',
  SPREADSHEET_ID: '1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU',
  RECEIPT_ROOT_FOLDER_ID: '1ER41h357d3tru7bQ1ulf78COcQ5fojan'
};

/**
 * Handle GET requests - ENHANCED with accept action support and receipt data
 * Note: This function is called by main.gs router, not directly
 */
function handleDashboardGet(e) {
  try {
    console.log('=== GET REQUEST RECEIVED ===');
    console.log('Parameters:', e.parameter);

    const action = e.parameter.action || '';
    console.log('Action:', action);

    switch (action) {
      case 'login':
        return handleLogin(e.parameter.email, e.parameter.accessCode);

      case 'getAllClients':
        return getAllClients();
     
      case 'markRevisionsViewed':
        console.log('Marking revisions viewed via GET');
        return markRevisionsViewed(e.parameter.code);

      case 'getExpenses':
        console.log('Processing getExpenses request');
        return getExpenses(); // ✅ no JSON.stringify, no extra TextOutput

      case 'getRevenue':
       console.log('Processing getRevenue request', JSON.stringify(e.parameter || {}));
        return getRevenue(e.parameter.id, e.parameter.sheet);


      case 'listRevisions':
        console.log('Processing listRevisions GET request');
        return listRevisions(e.parameter);          // ✅ no double-wrapping

      case 'listExpenses':
        console.log('Processing listExpenses GET request');
        return listExpenses(e.parameter);           // ✅ GET version

      case 'getFolderImages': {
        const folderLink = e.parameter.folderLink || e.parameter.folderId;
        const extractedFolderId = extractFolderIdFromLink(folderLink);
        return getFolderImages(extractedFolderId);
      }

      case 'getImages': {
        const folderLinkForImages = e.parameter.folderLink || e.parameter.folderId;
        const extractedFolderIdForImages = extractFolderIdFromLink(folderLinkForImages);
        return getFolderImages(extractedFolderIdForImages);
      }

      case 'getReceiptData':
        return getReceiptData(e.parameter.rowId);

      case 'verifyQuoteAccess':
        return verifyQuoteAccess(e.parameter.code, e.parameter.email);

      case 'getQuoteBreakdown':
        return getQuoteBreakdown(e.parameter.spreadsheetId, e.parameter.clientEmail);

      case 'accept':
        return handleQuoteAcceptanceViaGet(
          e.parameter.name,
          e.parameter.company,
          e.parameter.email,
          e.parameter.accessCode
        );

      case 'acceptEmail':
        return handleAcceptEmail(e);

      default:
        return createResponse(false, 'Invalid action: ' + (action || 'none provided'));
    }
  } catch (error) {
    console.error('doGet error:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}


/**
 * Extract folder ID from Google Drive folder link
 */
function extractFolderIdFromLink(folderLink) {
  if (!folderLink) return null;
  
  console.log(`Extracting folder ID from: ${folderLink}`);
  
  // Handle different Google Drive URL formats
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/, // Standard folder URL
    /id=([a-zA-Z0-9-_]+)/, // URL with id parameter
    /^([a-zA-Z0-9-_]+)$/, // Just the ID itself
  ];
  
  for (const pattern of patterns) {
    const match = folderLink.match(pattern);
    if (match) {
      console.log(`Extracted folder ID: ${match[1]}`);
      return match[1];
    }
  }
  
  console.log(`Could not extract folder ID from: ${folderLink}`);
  return folderLink; // Return as-is if no pattern matches
}

/**
 * Handle client login - Updated to use Master sheet structure with ENHANCED DEBUGGING
 */
function handleLogin(email, accessCode) {
  console.log(`Login attempt: Email="${email}", AccessCode="${accessCode}"`);
  
  if (!email || !accessCode) {
    return createResponse(false, 'Email and access code are required');
  }
  
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) {
    return createResponse(false, 'Master sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  console.log(`Total rows in sheet: ${data.length}`);
  
  // Log the header row to verify column structure
  if (data.length > 0) {
    console.log('Header row (first 20 columns):', data[0].slice(0, 20));
  }
  
  // Skip header row, search for matching credentials
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = row[5] ? row[5].toString().toLowerCase().trim() : '';
    const rowAccessCode = row[15] ? row[15].toString().trim() : '';
    
    // Check if email (F) and access code (P) match
    if (rowEmail === email.toLowerCase().trim() && rowAccessCode === accessCode.toString().trim()) {
      console.log(`✅ Login successful for: ${email} at row ${i + 1}`);
      
      // ENHANCED DEBUGGING: Log all relevant columns for this user
      console.log('=== COLUMN DEBUGGING ===');
      console.log(`Row ${i + 1} data:`);
      console.log(`Column A (0): ${row[0]}`);   // Timestamp
      console.log(`Column B (1): ${row[1]}`);   // Status
      console.log(`Column C (2): ${row[2]}`);   // 
      console.log(`Column D (3): ${row[3]}`);   // Name
      console.log(`Column E (4): ${row[4]}`);   // Company
      console.log(`Column F (5): ${row[5]}`);   // Email
      console.log(`Column G (6): ${row[6]}`);   // Phone
      console.log(`Column H (7): ${row[7]}`);   // Language
      console.log(`Column I (8): ${row[8]}`);   // Service
      console.log(`Column J (9): ${row[9]}`);   // 
      console.log(`Column K (10): ${row[10]}`); // Quote Total
      console.log(`Column L (11): ${row[11]}`); // 
      console.log(`Column M (12): ${row[12]}`); // 
      console.log(`Column N (13): ${row[13]}`); // Spreadsheet ID
      console.log(`Column O (14): ${row[14]}`); // Revision Folder
      console.log(`Column P (15): ${row[15]}`); // Access Code
      console.log(`Column Q (16): ${row[16]}`); // Upload Folder
      console.log(`Column R (17): ${row[17]}`); // Quote PDF URL
      console.log(`Column S (18): ${row[18]}`); // Receipt PDF URL
      console.log(`Column T (19): ${row[19]}`); // 
      console.log(`Column U (20): ${row[20]}`); // 
      console.log('=== END COLUMN DEBUGGING ===');
      
      const clientData = {
        status: row[1] || '',           // Column B
        name: row[3] || '',             // Column D
        company: row[4] || '',          // Column E
        email: row[5] || '',            // Column F
        phone: row[6] || '',            // Column G
        language: row[7] || '',         // Column H
        service: row[8] || '',         // Column I
        quotePdfUrl: row[17] || '',     // Column R
        receiptPdfUrl: row[18] || '',   // Column S - Receipt PDF URL
        quoteSpreadsheetId: row[13] || '', // Column N - Spreadsheet ID
        revisionFolderLink: row[14] || '', // Column O
        accessCode: row[15] || '',      // Column P
        uploadFolderLink: row[16] || '', // Column Q
        quoteTotal: row[10] || '0'      // Column K
      };
      
      // ENHANCED DEBUGGING: Log the final clientData object
      console.log('Final clientData object:');
      console.log('quotePdfUrl (Column R):', clientData.quotePdfUrl);
      console.log('receiptPdfUrl (Column S):', clientData.receiptPdfUrl);
      
      return createResponse(true, 'Login successful', { clientData });
    }
  }
  
  console.log(`❌ Login failed for: Email="${email}", AccessCode="${accessCode}"`);
  return createResponse(false, 'Invalid email or access code');
}

/**
 * Get quote breakdown from Quote sheet using spreadsheet ID
 */
function getQuoteBreakdown(spreadsheetId, clientEmail) {
  console.log(`Getting quote breakdown for: ${clientEmail} from spreadsheet ID: ${spreadsheetId}`);
  
  if (!spreadsheetId || !clientEmail) {
    return createResponse(false, 'Spreadsheet ID and client email are required');
  }
  
  try {
    // Construct full spreadsheet URL if only ID is provided
    let finalSpreadsheetId = spreadsheetId;
    if (!spreadsheetId.includes('spreadsheets')) {
      // It's just an ID, use it directly
      finalSpreadsheetId = spreadsheetId.trim();
    } else {
      // It's a full URL, extract the ID
      const spreadsheetIdMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (spreadsheetIdMatch) {
        finalSpreadsheetId = spreadsheetIdMatch[1];
      }
    }
    
    console.log(`Using spreadsheet ID: ${finalSpreadsheetId}`);
    
    // Open the target spreadsheet
    const targetSpreadsheet = SpreadsheetApp.openById(finalSpreadsheetId);
    const quoteSheet = targetSpreadsheet.getSheetByName(CONFIG.QUOTE_SHEET);
    
    if (!quoteSheet) {
      console.log(`Quote sheet not found in spreadsheet ${finalSpreadsheetId}`);
      return createResponse(false, 'Quote sheet not found');
    }
    
    const lastRow = quoteSheet.getLastRow();
    if (lastRow < 2) {
      console.log('No data rows found in Quote sheet');
      return createResponse(true, 'No quote items found', { 
        quoteItems: [],
        useDefault: true 
      });
    }
    
    // Get all data starting from row 2 (skip headers)
    const data = quoteSheet.getRange(2, 1, lastRow - 1, 3).getValues(); // A2:C(lastRow)
    console.log(`Found ${data.length} data rows in Quote sheet`);
    
    const quoteItems = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const itemName = row[0] ? row[0].toString().trim() : ''; // Column A - Item Name
      const quantity = row[1] ? parseFloat(row[1]) || 1 : 1; // Column B - Quantity
      const price = row[2] ? parseFloat(row[2]) || 0 : 0; // Column C - Price
      
      // Skip empty rows or rows with "TOTAL" (common in spreadsheets)
      if (!itemName || itemName.toUpperCase() === 'TOTAL' || itemName === '') {
        continue;
      }
      
      const total = quantity * price;
      
      quoteItems.push({
        description: itemName,
        quantity: quantity,
        price: price,
        total: total
      });
      
      console.log(`Added quote item: ${itemName} - Qty: ${quantity}, Price: ${price}, Total: ${total}`);
    }
    
    if (quoteItems.length === 0) {
      console.log(`No valid quote items found in spreadsheet ${finalSpreadsheetId}`);
      return createResponse(true, 'No quote items found', { 
        quoteItems: [],
        useDefault: true 
      });
    }
    
    console.log(`Successfully retrieved ${quoteItems.length} quote items`);
    return createResponse(true, 'Quote breakdown retrieved successfully', { 
      quoteItems: quoteItems,
      useDefault: false 
    });
    
  } catch (error) {
    console.error('Error getting quote breakdown:', error);
    
    if (error.message.includes('not found')) {
      return createResponse(false, 'Spreadsheet not found or access denied');
    } else if (error.message.includes('permission')) {
      return createResponse(false, 'Permission denied to access spreadsheet');
    } else {
      return createResponse(false, 'Failed to retrieve quote breakdown: ' + error.message);
    }
  }
}

/**
 * Verify quote access using access code and email - Updated to include spreadsheet ID
 */
function verifyQuoteAccess(accessCode, email) {
  console.log(`Verifying quote access: Code="${accessCode}", Email="${email}"`);
  
  if (!accessCode || !email) {
    return createResponse(false, 'Access code and email are required');
  }
  
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) {
    return createResponse(false, 'Master sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Skip header row, search for matching credentials
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = row[5] ? row[5].toString().toLowerCase().trim() : ''; // Column F
    const rowAccessCode = row[15] ? row[15].toString().trim() : ''; // Column P
    
    console.log(`Row ${i + 1}: Email="${rowEmail}", AccessCode="${rowAccessCode}"`);
    
    // Check if email (F) and access code (P) match
    if (rowEmail === email.toLowerCase().trim() && rowAccessCode === accessCode.toString().trim()) {
      console.log(`✅ Access verified for: ${email} at row ${i + 1}`);
      
      const clientData = {
        timestamp: row[0] ? row[0].toString() : '', // Column A
        status: row[1] || '',           // Column B
        clientName: row[3] || '',       // Column D
        companyName: row[4] || '',      // Column E
        email: row[5] || '',            // Column F
        phone: row[6] || '',            // Column G
        language: row[7] || '',         // Column H
        service: row[8] || '',         // Column I
        acceptQuoteLink: row[13] || '', // Column N
        quoteTotal: row[10] || '0',     // Column K
        quotePdfUrl: row[17] || '',     // Column R
        quoteSpreadsheetId: row[13] || '', // Column N - Spreadsheet ID
        accessCode: row[15] || '',      // Column P
        rowId: (i + 1).toString()
      };
      
      return createResponse(true, 'Access verified successfully', { clientData });
    }
  }
  
  console.log(`❌ Access verification failed for: Email="${email}", AccessCode="${accessCode}"`);
  return createResponse(false, 'This code or email doesn\'t match our records. Please check and try again.');
}

/**
 * Get receipt data for a specific row ID
 */
function getReceiptData(rowId) {
  console.log(`Getting receipt data for row: ${rowId}`);
  
  if (!rowId) {
    return createResponse(false, 'Row ID is required');
  }
  
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) {
    return createResponse(false, 'Master sheet not found');
  }
  
  try {
    const rowNumber = parseInt(rowId);
    if (isNaN(rowNumber) || rowNumber < 2) {
      return createResponse(false, 'Invalid row ID. Must be a number greater than 1.');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Check if row exists
    if (rowNumber > data.length) {
      return createResponse(false, 'Receipt not found. Row does not exist.');
    }
    
    const row = data[rowNumber - 1]; // Convert to 0-based index
    
    // Check if row has data (at least a client name)
    if (!row[3]) { // Column D (Client Name)
      return createResponse(false, 'Receipt not found. No client data in this row.');
    }
    
    const receiptData = {
      timestamp: row[0] ? row[0].toString() : '', // Column A
      status: row[1] ? row[1].toString() : '', // Column B
      clientName: row[3] ? row[3].toString() : '', // Column D
      companyName: row[4] ? row[4].toString() : '', // Column E
      email: row[5] ? row[5].toString() : '', // Column F
      phone: row[6] ? row[6].toString() : '', // Column G
      language: row[7] ? row[7].toString() : '', // Column H
      service: row[8] ? row[8].toString() : '', // Column I
      quoteTotal: row[10] ? row[10].toString() : '0', // Column K
      quotePdfUrl: row[17] ? row[17].toString() : '', // Column R
      quoteSheetUrl: row[10] ? row[10].toString() : '', // Column K - Quote Sheet URL
      rowId: rowId
    };
    
    console.log(`✅ Receipt data found for ${receiptData.clientName} (${receiptData.companyName})`);
    
    return createResponse(true, 'Receipt data retrieved successfully', { receiptData });
    
  } catch (error) {
    console.error('Error getting receipt data:', error);
    return createResponse(false, 'Failed to retrieve receipt data: ' + error.message);
  }
}

/**
 * Handle POST requests
 * Note: This function is called by main.gs router, not directly
 */
function handleDashboardPost(e) {
  try {
    console.log('=== POST REQUEST RECEIVED ===');
    console.log('Parameters:', e.parameter);

    const isJson = e.postData && e.postData.type && String(e.postData.type).indexOf('application/json') !== -1;
    const body = isJson ? JSON.parse(e.postData.contents || '{}') : e.parameter;

    // prefer explicit action in body, fall back to query param
    const action = (body && body.action) || e.parameter.action || '';
    console.log('Action:', action);
    console.log('Body:', body);

    // If this is quote data (your existing behavior), short-circuit
    if (body && body.clientName && body.quoteItems) {
      console.log('Processing quote data (JSON payload)');
      return handleQuoteDataReceived(body);
    }

    switch (action) {
      case 'accept':
        console.log('Processing quote acceptance via POST');
        return handleQuoteAcceptance(body.email, body.accessCode);

      case 'comment':
        console.log('Processing comment submission');
        return handleComment(
          body.name,
          body.company,
          body.service,
          body.email,
          body.comment,
          body.imageUrl,
          body.accessCode
        );

      case 'uploadFile':
        console.log('Processing file upload');
        return handleFileUpload(e); // keep original since it uses e directly

      case 'receiveQuoteData':
        console.log('Processing quote data reception');
        return handleQuoteDataReceived(JSON.parse(e.parameter.quoteData));
      
      case 'markRevisionsViewed':
        console.log('Marking revisions viewed via POST');
        return markRevisionsViewed((body && body.code) || e.parameter.code);


      case 'listExpenses':
        console.log('Processing listExpenses request');
        return listExpenses(body);  // ✅ pass parsed body (or e.parameter if form-encoded)

      default:
        console.log('Invalid POST action:', action);
        return createResponse(false, 'Invalid action: ' + (action || 'none provided'));
    }
  } catch (error) {
    console.error('doPost error:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}



/**
 * Handle quote acceptance via GET (for email links) - UPDATED with new redirect
 */
function handleQuoteAcceptanceViaGet(name, company, email, accessCode) {
  console.log(`Quote acceptance via GET: Name="${name}", Company="${company}", Email="${email}", AccessCode="${accessCode}"`);
  if (!name || !company || !email || !accessCode) {
    const missing = [];
    if (!name) missing.push('name');
    if (!company) missing.push('company');
    if (!email) missing.push('email');
    if (!accessCode) missing.push('accessCode');
    return createResponse(false, `Missing required information: ${missing.join(', ')}`);
  }
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) return createResponse(false, 'Master sheet not found');
  const data = sheet.getDataRange().getValues();
  console.log(`Searching through ${data.length - 1} client records...`);
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowName = row[3]?.toString().trim();
    const rowCompany = row[4]?.toString().trim();
    const rowEmail = row[5]?.toString().toLowerCase().trim();
    const rowAccessCode = row[15]?.toString().trim();
    const currentStatus = row[1];
    const fileId = row[13];
    if (
      rowName === name.trim() &&
      rowCompany === company.trim() &&
      rowEmail === email.toLowerCase().trim() &&
      rowAccessCode === accessCode
    ) {
   if (currentStatus?.toString().trim().toLowerCase() !== "quote sent") {
  return createResponse(false, "This quote has already been accepted or processed.");
    }
      try {
        // Update status
        sheet.getRange(i + 1, 2).setValue('Quote Accepted');
        console.log(`Status updated to "Quote Accepted" for ${rowName}`);
        // Notify
        sendNotificationEmail(
          'Quote Accepted',
          `${rowName} from ${rowCompany} has accepted their quote via email link.\nEmail: ${email}\nAccess Code: ${accessCode}`,
          {
            name: rowName,
            company: rowCompany,
            email: email,
            service: row[8] || 'Unknown',
            accessCode: accessCode
          }
        );
        // Redirect
        const redirectUrl = `https://clients.heavydetailing.com/quote-accepted?email=${encodeURIComponent(email)}&accessCode=${encodeURIComponent(accessCode)}`;
        return HtmlService.createHtmlOutput(`
          <script>
            window.location.href = "${redirectUrl}";
          </script>
          <p>Redirecting...</p>
        `);
      } catch (err) {
        console.error('Error updating sheet:', err);
        return HtmlService.createHtmlOutput("Failed to update your quote. Please try again later.");
      }
    }
  }
  return HtmlService.createHtmlOutput(`
    <h2>We couldn't find your quote information or it may have already been processed.</h2>
    <p>Please contact us directly if this seems incorrect.</p>
  `);
}

/**
 * Handle quote acceptance using only email and access code (for dashboard)
 */
function handleQuoteAcceptance(email, accessCode) {
  console.log(`Quote acceptance request: Email="${email}", AccessCode="${accessCode}"`);
  if (!email || !accessCode) {
    const missing = [];
    if (!email) missing.push('email');
    if (!accessCode) missing.push('accessCode');
    return createResponse(false, `Missing required information: ${missing.join(', ')}`);
  }
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) return createResponse(false, 'Master sheet not found');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = row[5]?.toString().toLowerCase().trim();
    const rowAccessCode = row[15]?.toString().trim();
    const rowName = row[3]?.toString().trim();
    const rowCompany = row[4]?.toString().trim();
    const currentStatus = row[1];
    const fileId = row[13];
    if (rowEmail === email.toLowerCase().trim() && rowAccessCode === accessCode.trim()) {
  if (currentStatus?.toString().trim().toLowerCase() !== "quote sent") {
  return createResponse(false, "This quote has already been accepted or processed.");
  }
      try {
        sheet.getRange(i + 1, 2).setValue('Quote Accepted');
        console.log(`Status updated to "Quote Accepted" for ${rowName}`);
        sendNotificationEmail(
          'Quote Accepted',
          `${rowName} from ${rowCompany} has accepted their quote via dashboard.\nEmail: ${email}\nAccess Code: ${accessCode}`,
          {
            name: rowName,
            company: rowCompany,
            email: email,
            service: row[8] || 'Unknown',
            accessCode: accessCode
          }
        );
        return createResponse(true, 'Quote accepted successfully');
      } catch (err) {
        console.error('Error updating sheet:', err);
        return createResponse(false, 'Failed to update quote status. Please try again.');
      }
    }
  }
  return createResponse(false, "Client not found. Please contact support if this error persists.");
}

/**
 * Get images from Google Drive folder with better URL formats
 */
function getFolderImages(folderId) {
  console.log(`Getting images from folder: ${folderId}`);
  
  if (!folderId) {
    return createResponse(false, 'Folder ID is required');
  }
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const images = [];
    
    // Get all image files (JPEG, PNG, GIF, etc.)
    const imageTypes = [
      MimeType.JPEG,
      MimeType.PNG,
      MimeType.GIF,
      MimeType.BMP,
      MimeType.WEBP
    ];
    
    imageTypes.forEach(mimeType => {
      try {
        const files = folder.getFilesByType(mimeType);
        while (files.hasNext()) {
          const file = files.next();
          
          // Make sure file is accessible
          try {
            const fileId = file.getId();
            const fileName = file.getName();
            
            // Set file to be viewable by anyone with link
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            
            // Provide multiple URL formats for better compatibility
            images.push({
              id: fileId,
              name: fileName,
              url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`, // Thumbnail format
              fullUrl: `https://drive.google.com/file/d/${fileId}/view`, // Full view
              directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`, // Direct download
              viewUrl: `https://drive.google.com/uc?export=view&id=${fileId}`, // Alternative view
              mimeType: mimeType,
              size: file.getSize(),
              lastModified: file.getLastUpdated().toISOString()
            });
            
            console.log(`Added image: ${fileName} (${fileId}) - Size: ${file.getSize()} bytes`);
          } catch (fileError) {
            console.error(`Error processing file ${file.getName()}:`, fileError);
          }
        }
      } catch (typeError) {
        console.error(`Error getting files of type ${mimeType}:`, typeError);
      }
    });
    
    // Sort images by name for consistent ordering
    images.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Retrieved ${images.length} images from folder ${folderId}`);
    
    if (images.length === 0) {
      return createResponse(true, 'No images found in folder', { images: [] });
    }
    
    return createResponse(true, 'Images retrieved successfully', { images });
    
  } catch (error) {
    console.error('Error accessing folder:', error);
    
    if (error.message.includes('not found')) {
      return createResponse(false, 'Folder not found. Please check the folder link.');
    } else if (error.message.includes('permission')) {
      return createResponse(false, 'Permission denied. Please check folder sharing settings.');
    } else {
      return createResponse(false, 'Unable to access folder: ' + error.message);
    }
  }
}

/**
 * Get all clients (admin only) - Updated to include spreadsheet ID and ENHANCED DEBUGGING
 */
function getAllClients() {
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) {
    return createResponse(false, 'Master sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const clients = [];
  
  console.log('=== ADMIN VIEW - ALL CLIENTS DEBUGGING ===');
  console.log(`Total rows in sheet: ${data.length}`);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[3]) { // Only include rows with names
      console.log(`Row ${i + 1} - Column S (18): "${row[18]}"`); // Debug Column S
      
      clients.push({
    
        date: row[0] || '',          // Column A - Date
        status: row[1] || '',
        name: row[3] || '',
        company: row[4] || '',
        email: row[5] || '',
        phone: row[6] || '',
        language: row[7] || '',
        service: row[8] || '',
        cost: row[9] || 0,           // Column J - Cost
        price: row[10] || 0,         // Column K - Price  
        driveLink: row[11] || '',           // Column L - Drive link
        briefLink: row[12] || '',           // Column M - Brief link  
        quoteSpreadsheetId: row[13] || '', // Column N - Spreadsheet ID
        revisionFolderLink: row[14] || '',
        accessCode: row[15] || '',
        uploadFolderLink: row[16] || '',
        quotePdfUrl: row[17] || '',
        receiptPdfUrl: row[18] || '',   // Column S - Receipt PDF URL
        timeAmount: row[21] || '',          // Column V - Time amount (to show on button)
        timesheetLink: row[22] || '',
      });
    }
  }
  
  console.log('=== END ADMIN DEBUGGING ===');
  
  return createResponse(true, 'Clients retrieved successfully', { clients });
}

/**
 * Handle comment submission - Fixed to use correct sheet name
 */
function handleComment(name, company, service, email, comment, imageUrl, accessCode) {
  console.log(`Comment submission: ${name} (${company}) - "${comment}"`);
  
  if (!name || !company || !email || !comment || !accessCode) {
    const missing = [];
    if (!name) missing.push('name');
    if (!company) missing.push('company');
    if (!email) missing.push('email');
    if (!comment) missing.push('comment');
    if (!accessCode) missing.push('accessCode');
    
    console.log(`Missing required fields: ${missing.join(', ')}`);
    return createResponse(false, `Missing required information: ${missing.join(', ')}`);
  }
  
  const sheet = getSheet(CONFIG.COMMENTS_SHEET); // Fixed: now uses 'Comments' sheet
  if (!sheet) {
    console.error(`Comments sheet not found. Looking for sheet named: "${CONFIG.COMMENTS_SHEET}"`);
    
    // List all available sheets for debugging
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const allSheets = spreadsheet.getSheets().map(s => s.getName());
    console.log('Available sheets:', allSheets);
    
    return createResponse(false, `Comments sheet not found. Available sheets: ${allSheets.join(', ')}`);
  }
  
  try {
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      name,
      company,
      service,
      email,
      comment.trim(),
      imageUrl || '',
      accessCode
    ]);
    
    console.log(`✅ Comment submitted successfully: ${name} (${company})`);
    
    // Send notification email
    try {
      const emailBody = `${name} from ${company} left a comment:\n\n"${comment}"` +
                       (imageUrl ? `\n\nOn image: ${imageUrl}` : '') +
                       `\n\nService: ${service}` +
                       `\nEmail: ${email}` +
                       `\nAccess Code: ${accessCode}`;
      
      sendNotificationEmail('New Client Comment', emailBody, {
        name, company, email, service, comment, imageUrl, accessCode
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }
    
    return createResponse(true, 'Comment submitted successfully');
    
  } catch (error) {
    console.error('Error submitting comment:', error);
    return createResponse(false, 'Failed to submit comment. Please try again.');
  }
}

/**
 * Handle file upload to specific Google Drive folder
 */
function handleFileUpload(e) {
  try {
    console.log('File upload request received');
    console.log('Parameters:', Object.keys(e.parameter));
    
    const folderId = e.parameter.folderId;
    const fileName = e.parameter.fileName;
    const fileData = e.parameter.fileData;
    const mimeType = e.parameter.mimeType;
    const fileSize = e.parameter.fileSize;
    
    console.log(`Upload details: ${fileName}, ${mimeType}, ${fileSize} bytes`);
    
    if (!folderId) {
      return createResponse(false, 'Folder ID is required');
    }
    
    if (!fileData) {
      return createResponse(false, 'No file data provided');
    }
    
    if (!fileName) {
      return createResponse(false, 'File name is required');
    }
    
    // Get the target folder
    const folder = DriveApp.getFolderById(folderId);
    console.log(`Target folder: ${folder.getName()}`);
    
    // Decode base64 data and create blob
    const decodedData = Utilities.base64Decode(fileData);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);
    
    // Create the file in the folder
    const uploadedFile = folder.createFile(blob);
    
    // Set file permissions to be viewable by anyone with link
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log(`✅ File uploaded successfully: ${uploadedFile.getName()} (${uploadedFile.getId()})`);
    
    // Send notification email about the upload
    try {
      GmailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, `${CONFIG.BUSINESS_NAME} - New File Uploaded`, '', {
            htmlBody: `A new file has been uploaded to the client folder.<br><br>` +
            `File: ${uploadedFile.getName()}<br>` +
            `Size: ${fileSize} bytes<br>` +
            `Type: ${mimeType}<br>` +
            `Folder: ${folder.getName()}<br>` +
            `Time: ${new Date().toLocaleString()}<br><br>` +
            `View file: <a href="https://drive.google.com/file/d/${uploadedFile.getId()}/view">${uploadedFile.getName()}</a>`
        });
      console.log('Upload notification email sent');
    } catch (emailError) {
      console.error('Failed to send upload notification email:', emailError);
    }
    
    return createResponse(true, 'File uploaded successfully', {
      fileId: uploadedFile.getId(),
      fileName: uploadedFile.getName(),
      fileUrl: `https://drive.google.com/file/d/${uploadedFile.getId()}/view`,
      fileSize: uploadedFile.getSize()
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.message.includes('not found')) {
      return createResponse(false, 'Upload folder not found. Please contact support.');
    } else if (error.message.includes('permission')) {
      return createResponse(false, 'Permission denied. Please contact support.');
    } else if (error.message.includes('Invalid argument')) {
      return createResponse(false, 'Invalid file data. Please try again.');
    } else {
      return createResponse(false, 'Upload failed: ' + error.message);
    }
  }
}

/**
 * Get a specific sheet by name
 */
function getSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found`);
      const allSheets = spreadsheet.getSheets().map(s => s.getName());
      console.log('Available sheets:', allSheets);
    }
    
    return sheet;
  } catch (error) {
    console.error(`Error getting sheet ${sheetName}:`, error);
    return null;
  }
}

/**
 * Create standardized response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    Object.assign(response, data);
  }
  
  console.log('Creating response:', response);
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Send notification email
 */
function sendNotificationEmail(subject, body, data) {
  try {
    const fullSubject = `${CONFIG.BUSINESS_NAME} - ${subject}`;
    const fullBody = `${body}\n\n---\nClient Details:\n` +
                    `Name: ${data.name}\nCompany: ${data.company}\n` +
                    `Email: ${data.email}\nService: ${data.service || 'N/A'}\n` +
                    `Access Code: ${data.accessCode}\nTime: ${new Date().toLocaleString()}`;
    
    GmailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, fullSubject, '', {
      htmlBody: fullBody
      });
    
    console.log(`Notification email sent: ${subject}`);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

/**
 * Receive quote data from external script and store it
 * This function can be called via POST request from the sendQuoteToV0 function
 */
function handleQuoteDataReceived(quoteData) {
  console.log('Processing received quote data:', quoteData);
  
  try {
    const {
      clientName,
      companyName,
      service,
      email,
      accessCode,
      totalPrice,
      quoteItems,
      spreadsheetId
    } = quoteData;
    
    // Validate required data
    if (!email || !quoteItems || !Array.isArray(quoteItems)) {
      return createResponse(false, 'Invalid quote data: missing email or quote items');
    }
    
    // Find the client in Master sheet to get their spreadsheet ID
    const masterSheet = getSheet(CONFIG.CLIENTS_SHEET);
    if (!masterSheet) {
      return createResponse(false, 'Master sheet not found');
    }
    
    const masterData = masterSheet.getDataRange().getValues();
    let clientSpreadsheetId = spreadsheetId;
    let clientRowIndex = -1;
    
    // Find client row and get spreadsheet ID if not provided
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const rowEmail = row[5] ? row[5].toString().toLowerCase().trim() : '';
      
      if (rowEmail === email.toLowerCase().trim()) {
        clientRowIndex = i;
        if (!clientSpreadsheetId) {
          clientSpreadsheetId = row[13]; // Column N - Spreadsheet ID
        }
        break;
      }
    }
    
    if (clientRowIndex === -1) {
      return createResponse(false, 'Client not found in Master sheet');
    }
    
    if (!clientSpreadsheetId) {
      return createResponse(false, 'No spreadsheet ID found for client');
    }
    
    // Open the client's quote spreadsheet
    let targetSpreadsheet;
    try {
      // Handle both full URLs and bare IDs
      let finalSpreadsheetId = clientSpreadsheetId;
      if (clientSpreadsheetId.includes('spreadsheets')) {
        const spreadsheetIdMatch = clientSpreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (spreadsheetIdMatch) {
          finalSpreadsheetId = spreadsheetIdMatch[1];
        }
      }
      
      targetSpreadsheet = SpreadsheetApp.openById(finalSpreadsheetId);
    } catch (error) {
      console.error('Error opening target spreadsheet:', error);
      return createResponse(false, 'Could not access client quote spreadsheet');
    }
    
    // Get or create Quote sheet
    let quoteSheet = targetSpreadsheet.getSheetByName(CONFIG.QUOTE_SHEET);
    if (!quoteSheet) {
      // Create Quote sheet if it doesn't exist
      quoteSheet = targetSpreadsheet.insertSheet(CONFIG.QUOTE_SHEET);
      
      // Add headers
      quoteSheet.getRange(1, 1, 1, 5).setValues([
        ['Client Email', 'Description', 'Quantity', 'Price', 'Total']
      ]);
      
      // Format headers
      const headerRange = quoteSheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    // Clear existing data for this client (keep headers)
    const existingData = quoteSheet.getDataRange().getValues();
    const rowsToDelete = [];
    
    for (let i = 1; i < existingData.length; i++) {
      const rowEmail = existingData[i][0] ? existingData[i][0].toString().toLowerCase().trim() : '';
      if (rowEmail === email.toLowerCase().trim()) {
        rowsToDelete.push(i + 1); // Convert to 1-based index
      }
    }
    
    // Delete rows in reverse order to maintain indices
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      quoteSheet.deleteRow(rowsToDelete[i]);
    }
    
    // Add new quote items
    const newRows = [];
    for (const item of quoteItems) {
      const quantity = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.price) || 0;
      const total = quantity * price;
      
      newRows.push([
        email,                    // Column A - Client Email
        item.item || item.description || '', // Column B - Description
        quantity,                 // Column C - Quantity
        price,                    // Column D - Price
        total                     // Column E - Total
      ]);
    }
    
    if (newRows.length > 0) {
      const startRow = quoteSheet.getLastRow() + 1;
      quoteSheet.getRange(startRow, 1, newRows.length, 5).setValues(newRows);
      
      // Format currency columns
      const priceRange = quoteSheet.getRange(startRow, 4, newRows.length, 1);
      const totalRange = quoteSheet.getRange(startRow, 5, newRows.length, 1);
      priceRange.setNumberFormat('$#,##0.00');
      totalRange.setNumberFormat('$#,##0.00');
    }
    
    // Update total in Master sheet if provided
    if (totalPrice && clientRowIndex > 0) {
      try {
        masterSheet.getRange(clientRowIndex + 1, 11).setValue(totalPrice); // Column K
        console.log(`Updated total price in Master sheet: ${totalPrice}`);
      } catch (error) {
        console.error('Error updating total in Master sheet:', error);
      }
    }
    
    console.log(`✅ Quote data updated successfully for ${clientName} (${email})`);
    console.log(`Added ${newRows.length} quote items to spreadsheet ${finalSpreadsheetId}`);
    
    // Send confirmation email
    try {
      sendNotificationEmail(
        'Quote Data Updated',
        `Quote data has been successfully updated for ${clientName} from ${companyName}.
        
Items updated: ${newRows.length}
Total: ${totalPrice || 'Not specified'}
Service: ${service}
The client can now view their detailed quote breakdown in the dashboard.`,
        {
          name: clientName,
          company: companyName,
          email: email,
          service: service,
          accessCode: accessCode
        }
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }
    
    return createResponse(true, 'Quote data updated successfully', {
      itemsUpdated: newRows.length,
      clientEmail: email,
      spreadsheetId: finalSpreadsheetId
    });
    
  } catch (error) {
    console.error('Error handling quote data:', error);
    return createResponse(false, 'Failed to update quote data: ' + error.message);
  }
}

/**
 * Manual function to send quote data (can be called from Apps Script editor)
 * This replicates the sendQuoteToV0 functionality within our script
 */
function sendQuoteDataToSelf(rowIndex) {
  console.log(`Sending quote data for row ${rowIndex}`);
  
  try {
    const sheet = getSheet(CONFIG.CLIENTS_SHEET);
    if (!sheet) {
      throw new Error('Master sheet not found');
    }
    
    const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const clientName = row[3];      // Column D
    const companyName = row[4];     // Column E
    const email = row[5];           // Column F
    const service = row[8];         // Column I
    const spreadsheetId = row[13];  // Column N
    const accessCode = row[15];     // Column P
    
    if (!email || !spreadsheetId) {
      throw new Error('Missing email or spreadsheet ID');
    }
    
    // Open the estimate spreadsheet
    let finalSpreadsheetId = spreadsheetId;
    if (spreadsheetId.includes('spreadsheets')) {
      const spreadsheetIdMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (spreadsheetIdMatch) {
        finalSpreadsheetId = spreadsheetIdMatch[1];
      }
    }
    
    const estimateSpreadsheet = SpreadsheetApp.openById(finalSpreadsheetId);
    const quoteSheet = estimateSpreadsheet.getSheetByName("Quote");
    
    if (!quoteSheet) {
      throw new Error('Quote sheet not found in estimate spreadsheet');
    }
    
    // Get quote data (assuming structure: Item, Quantity, Price in columns A, B, C)
    const quoteData = quoteSheet.getRange(2, 1, quoteSheet.getLastRow() - 1, 3).getValues();
    const quoteItems = [];
    
    for (let i = 0; i < quoteData.length; i++) {
      const [item, quantity, price] = quoteData[i];
      if (!item || item.toString().toUpperCase() === "TOTAL") break;
      
      if (item.toString().trim() !== '') {
        quoteItems.push({ 
          item: item.toString(), 
          quantity: parseFloat(quantity) || 1, 
          price: parseFloat(price) || 0 
        });
      }
    }
    
    // Get total price (assuming it's in column C at the row after items)
    let totalPrice = 0;
    try {
      const totalRow = quoteItems.length + 2;
      totalPrice = quoteSheet.getRange(totalRow, 3).getValue();
      if (typeof totalPrice !== 'number') {
        // Calculate total if not found
        totalPrice = quoteItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      }
    } catch (error) {
      console.log('Could not get total price, calculating from items');
      totalPrice = quoteItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }
    
    const payload = {
      clientName,
      companyName,
      service,
      email,
      accessCode,
      totalPrice,
      quoteItems,
      spreadsheetId: finalSpreadsheetId
    };
    
    console.log('Quote payload prepared:', payload);
    
    // Process the data directly (since we're in the same script)
    const result = handleQuoteDataReceived(payload);
    
    console.log('Quote data processing result:', result.getContent());
    
    return `Quote data sent successfully for ${clientName}. ${quoteItems.length} items processed.`;
    
  } catch (error) {
    console.error('Error in sendQuoteDataToSelf:', error);
    throw error;
  }
}

/**
 * Test function to verify quote data handling
 */
function testQuoteDataHandling() {
  console.log('=== TESTING QUOTE DATA HANDLING ===');
  
  // Test with sample data
  const testData = {
    clientName: "Test Client",
    companyName: "Test Company",
    service: "Test Service",
    email: "test@example.com",
    accessCode: "1234",
    totalPrice: 150.00,
    quoteItems: [
      { item: "Design Setup", quantity: 1, price: 50.00 },
      { item: "Printing", quantity: 2, price: 50.00 }
    ],
    spreadsheetId: CONFIG.SPREADSHEET_ID
  };
  
  const result = handleQuoteDataReceived(testData);
  console.log('Test result:', result.getContent());
  
  return 'Test completed - check logs';
}

/**
 * Test function to test the script and check Column S specifically
 */
function testScript() {
  console.log('=== TESTING SCRIPT ===');
  
  // Test login
  const loginResult = handleLogin('test@example.com', '1234');
  console.log('Login test result:', loginResult.getContent());
  
  // Test quote acceptance
  const acceptResult = handleQuoteAcceptanceViaGet('Test User', 'Test Company', 'test@example.com', '1234');
  console.log('Accept test result:', typeof acceptResult);
  
  // Test receipt data
  const receiptResult = getReceiptData('2');
  console.log('Receipt test result:', receiptResult.getContent());
  
  // Test quote access verification
  const verifyResult = verifyQuoteAccess('1234', 'test@example.com');
  console.log('Verify test result:', verifyResult.getContent());
  
  // Test quote breakdown
  const breakdownResult = getQuoteBreakdown('1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU', 'test@example.com');
  console.log('Breakdown test result:', breakdownResult.getContent());
  
  return 'Test completed - check logs';
}

/**
 * SPECIFIC FUNCTION TO DEBUG COLUMN S
 */
function debugColumnS() {
  console.log('=== DEBUGGING COLUMN S SPECIFICALLY ===');
  
  const sheet = getSheet(CONFIG.CLIENTS_SHEET);
  if (!sheet) {
    console.log('❌ Master sheet not found');
    return 'Master sheet not found';
  }
  
  const data = sheet.getDataRange().getValues();
  console.log(`Total rows: ${data.length}`);
  console.log(`Total columns: ${data[0] ? data[0].length : 0}`);
  
  // Check header row
  if (data.length > 0) {
    console.log('=== HEADER ROW ===');
    for (let col = 0; col < data[0].length; col++) {
      const letter = String.fromCharCode(65 + col); // A=65, B=66, etc.
      console.log(`Column ${letter} (${col}): "${data[0][col]}"`);
    }
  }
  
  // Check all data rows for Column S (index 18)
  console.log('=== COLUMN S DATA ===');
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const columnS = row[18]; // Column S
    const clientName = row[3]; // Column D for reference
    
    if (clientName) { // Only show rows with client names
      console.log(`Row ${i + 1} - ${clientName}: Column S = "${columnS}"`);
    }
  }
  
  return 'Column S debugging completed - check logs';
}

function listRevisions(requestData) {
  try {
    const code = requestData.code;
    console.log('Getting revisions for client code:', code);
    
    const spreadsheetId = '1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const commentsSheet = spreadsheet.getSheetByName('Comments');
    
    if (!commentsSheet) {
      return createResponse(true, 'Comments sheet not found', { revisions: [] }); // ✅ Wrap in object
    }
    
    const data = commentsSheet.getDataRange().getValues();
    const revisions = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (row[7] && row[7].toString() === code.toString()) {
        revisions.push({
          timestamp: row[0] || '',
          clientName: row[1] || '',
          companyName: row[2] || '',
          service: row[3] || '',
          email: row[4] || '',
          comment: row[5] || '',
          imageUrl: row[6] || '',
          code: row[7] || '',
          status: row[8] || ''
        });
      }
    }
    
    revisions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // ✅ Wrap revisions in an object like getAllClients does
    return createResponse(true, 'Revisions retrieved successfully', { revisions });
    
  } catch (error) {
    console.error('Error in listRevisions:', error);
    return createResponse(false, 'Failed to retrieve revisions: ' + error.toString());
  }
}

function listExpenses(data) {
  try {
    console.log('=== LIST EXPENSES REQUEST ===', data);
    const code = data && data.code ? String(data.code).trim() : "";

    const expensesSheet = getSheet('Expenses');
    if (!expensesSheet) return createResponse(true, 'No expenses sheet found', { expenses: [] });

    const rows = expensesSheet.getDataRange().getValues();
    const expenses = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!code || String(row[0]) === code) {
        expenses.push({
          code: row[0] || '',
          date: row[1] || '',
          category: row[2] || '',
          amount: parseFloat(row[3]) || 0,
          note: row[4] || '',
          receiptUrl: row[5] || ''
        });
      }
    }
    return createResponse(true, 'Expenses retrieved successfully', { expenses }); // ✅ wrap
  } catch (error) {
    console.error('Error in listExpenses:', error);
    return createResponse(false, 'Failed to retrieve expenses: ' + error.toString());
  }
}

function markRevisionsViewed(code) {
  if (!code) return createResponse(false, 'Missing required parameter: code');

  const sheet = getSheet(CONFIG.COMMENTS_SHEET);
  if (!sheet) return createResponse(false, 'Comments sheet not found');

  const range = sheet.getDataRange();
  const rows = range.getValues();
  if (rows.length < 2) return createResponse(true, 'No comments to update', { updated: 0 });

  // Ensure a "ViewedAt" column exists (create header if missing)
  const header = rows[0];
  let viewedCol = header.indexOf('ViewedAt');
  if (viewedCol === -1) {
    viewedCol = header.length;              // append as next column
    sheet.getRange(1, viewedCol + 1).setValue('ViewedAt');
  }

  let updated = 0;
  for (let r = 1; r < rows.length; r++) {
    const accessCode = rows[r][7] ? String(rows[r][7]) : '';
    if (accessCode === String(code)) {
      sheet.getRange(r + 1, viewedCol + 1).setValue(new Date());
      updated++;
    }
  }

  return createResponse(true, 'Marked revisions as viewed', { updated });
}

function getExpenses() {
  try {
    console.log('Getting total expenses');

    const expensesSpreadsheetId = '1g_F1nDhv_lLrEWarvRa0gU_0Tulq30AxBL6-o-VbWWg';
    const spreadsheet = SpreadsheetApp.openById(expensesSpreadsheetId);
    const expensesSheet = spreadsheet.getSheetByName('Expenses'); // adjust if needed

    if (!expensesSheet) {
      return createResponse(false, 'Expenses sheet not found');
    }

    // Use display values so we can normalize strings like "$1,234.56"
    const data = expensesSheet.getDataRange().getDisplayValues();
    if (!data || data.length < 2) {
      return createResponse(true, 'No expense rows found', { expenses: { total: 0 } });
    }

    // Find the "Total" column by header text (case-insensitive)
    const header = data[0].map(h => String(h || '').trim());
    let totalCol = header.findIndex(h => /total/i.test(h));
    if (totalCol === -1) {
      // Fallback to column C (index 2) if header isn't found
      totalCol = 2;
      console.log('Total header not found; falling back to column C (index 2).');
    }

    // Helper to normalize currency-like strings
    const toNumber = v => {
      if (typeof v === 'number') return v;
      const n = Number(String(v || '').replace(/[^0-9.\-]+/g, ''));
      return isNaN(n) ? 0 : n;
    };

    let totalExpenses = 0;
    for (let i = 1; i < data.length; i++) {
      totalExpenses += toNumber(data[i][totalCol]);
    }

    return createResponse(true, 'Expenses retrieved successfully', {
      expenses: { total: totalExpenses }
    });

  } catch (error) {
    console.error('Error in getExpenses:', error);
    return createResponse(false, 'Failed to retrieve expenses: ' + error.toString());
  }
}

function getRevenue(spreadsheetId, sheetName) {
  try {
    console.log('Getting total revenue (master!K)');

    // If you don't pass an ID, this constant is used. Replace with your Master sheet ID.
    const DEFAULT_REVENUE_SHEET_ID = 'PUT_YOUR_MASTER_SPREADSHEET_ID_HERE';
    const ID = spreadsheetId || DEFAULT_REVENUE_SHEET_ID;
    const NAME = (sheetName || 'Master').trim();

    const ss = SpreadsheetApp.openById(ID);
    const sheet = ss.getSheetByName(NAME);
    if (!sheet) return createResponse(false, `Revenue sheet "${NAME}" not found`);

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return createResponse(true, 'No revenue rows found', { revenue: { total: 0 } });
    }

    // Column K = 11th column; read values (not formulas)
    const values = sheet.getRange(2, 11, lastRow - 1, 1).getValues();

    let total = 0;
    for (let i = 0; i < values.length; i++) {
      const v = values[i][0];
      if (typeof v === 'number') {
        total += v;                  // already the computed value from the formula
      } else if (typeof v === 'string' && v.trim() !== '') {
        // in case the column is formatted as currency and returns a string
        const neg = /^\(.*\)$/.test(v);
        const n = parseFloat(v.replace(/[^\d.-]/g, ''));
        if (!isNaN(n)) total += neg ? -n : n;
      }
    }

    return createResponse(true, 'Revenue retrieved successfully', { revenue: { total } });

  } catch (err) {
    console.error('Error in getRevenue:', err);
    return createResponse(false, 'Failed to retrieve revenue: ' + err.toString());
  }
}
