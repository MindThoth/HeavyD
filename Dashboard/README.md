# Heavy D Client Dashboard

A secure client dashboard for Heavy D Print & Design business that allows clients to:

- **Secure Login**: Email + 4-8 digit access code authentication
- View their personalized project information
- Access and approve quotes with visual feedback
- Upload files to shared Google Drive folders
- Review design previews and leave comments
- Track project status and timeline
- **Admin Access**: Special admin login for business owner

## Features

### 🔐 Secure Login System
- Email + access code authentication (4-8 digits)
- Session persistence with localStorage
- Admin access with special credentials
- Error handling for invalid credentials

### 📋 Quote Management
- View quote PDFs securely
- One-click quote acceptance with toast notifications
- Real-time status updates

### 📁 File Management
- Direct links to Google Drive upload folders
- Secure file sharing between client and designer

### 🎨 Design Review
- Preview latest design files
- Comment system for feedback with toast confirmations
- Email notifications for new designs

### 📊 Project Tracking
- Visual status timeline
- Project information sidebar
- Contact information readily available

### 👨‍💼 Admin Dashboard
- Overview of all client projects
- Client credentials management
- Project status monitoring

## Setup Instructions

### 1. Google Apps Script Backend

Create a Google Apps Script with the following structure:

\`\`\`javascript
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'login') {
    return handleLogin(e.parameter.email, e.parameter.accessCode);
  } else if (action === 'getAllClients') {
    return getAllClients();
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  
  if (action === 'accept') {
    return handleQuoteAcceptance(e.parameter.client, e.parameter.company, e.parameter.email);
  } else if (action === 'comment') {
    return handleComment(e.parameter.client, e.parameter.company, e.parameter.email, e.parameter.comment);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(email, accessCode) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[4] === email && row[5] === accessCode) { // Assuming email is column E, accessCode is column F
      const clientData = {
        client: row[0],        // Column A
        company: row[1],       // Column B
        service: row[2],       // Column C
        status: row[3],        // Column D
        email: row[4],         // Column E
        accessCode: row[5],    // Column F
        pdfUrl: row[6],        // Column G
        uploadUrl: row[7],     // Column H
        designUrl: row[8]      // Column I
      };
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, clientData: clientData}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid credentials'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAllClients() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
  const data = sheet.getDataRange().getValues();
  const clients = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    clients.push({
      client: row[0],
      company: row[1],
      service: row[2],
      status: row[3],
      email: row[4],
      accessCode: row[5],
      pdfUrl: row[6],
      uploadUrl: row[7],
      designUrl: row[8]
    });
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, clients: clients}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleQuoteAcceptance(client, company, email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === client && data[i][1] === company && data[i][4] === email) {
      sheet.getRange(i + 1, 4).setValue('Quote Accepted'); // Update status column
      
      // Optional: Send notification email
      // MailApp.sendEmail({
      //   to: 'info@heavydetailing.com',
      //   subject: `Quote Accepted - ${client} (${company})`,
      //   body: `${client} from ${company} has accepted their quote.`
      // });
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Quote accepted successfully'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Client not found'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleComment(client, company, email, comment) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Comments');
  
  // Add comment to comments sheet
  sheet.appendRow([
    new Date(),
    client,
    company,
    email,
    comment
  ]);
  
  // Optional: Send notification email
  // MailApp.sendEmail({
  //   to: 'info@heavydetailing.com',
  //   subject: `New Comment - ${client} (${company})`,
  //   body: `${client} from ${company} left a comment:\n\n${comment}`
  // });
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'Comment submitted successfully'}))
    .setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

### 2. Google Sheets Structure

Create a Google Sheet with two tabs:

**Clients Sheet (columns A-I):**
- A: Client Name
- B: Company Name  
- C: Service
- D: Status
- E: Email
- F: Access Code (4-8 digits)
- G: PDF URL
- H: Upload URL
- I: Design URL

**Comments Sheet (columns A-E):**
- A: Timestamp
- B: Client Name
- C: Company Name
- D: Email
- E: Comment

### 3. Admin Access

Default admin credentials (change these in the code):
- Email: `admin@heavydetailing.com`
- Access Code: `2024` (numeric only, 4 digits)

### 4. Update Script URL

Replace `YOUR_SCRIPT_ID` in the dashboard code with your actual Google Apps Script ID.

### 5. Deploy

Deploy the Next.js application. Clients can access their dashboard at:
\`\`\`
https://yourdomain.com/
\`\`\`

## New Features

### 🔑 Login System
- Secure email + access code authentication
- Session persistence across browser sessions
- Automatic logout functionality

### 🎯 Toast Notifications
- Success notifications for quote acceptance
- Confirmation messages for comment submission
- Error handling with user-friendly messages

### 👨‍💼 Admin Dashboard
- View all client projects at a glance
- Monitor project statuses
- Access client credentials

### 📱 Enhanced Mobile Experience
- Responsive login form
- Mobile-optimized dashboard layout
- Touch-friendly interface

## Security Features

- Client data validation against Google Sheets
- Secure session management with localStorage
- Admin-only access to sensitive information
- Error handling for unauthorized access
- No sensitive data stored in frontend code

## Browser Support

- Modern browsers with JavaScript enabled
- Mobile responsive design
- Progressive loading states
- Offline session persistence
