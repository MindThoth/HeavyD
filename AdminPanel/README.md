# Heavy D Admin Dashboard

Admin dashboard for Heavy Detailing client management, pricing calculator, and timesheet tracking.

## Features

- **Client Management**: View and manage all clients from your Google Sheets Master sheet
- **Pricing Calculator**: Calculate prices for stickers, boat lettering, and logo design services
- **Timesheet Tracker**: Track time spent on client projects
- **Google Drive Integration**: Direct links to client folders and documents
- **Real-time Data**: Connected directly to your Google Sheets

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_MASTER_SHEET_ID=1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU
NEXT_PUBLIC_CALCULATOR_SHEET_ID=1_jLOhyotUzNNmfrzGpH9tRoO06LOsiCFaaRKaSWcjVU
NEXT_PUBLIC_TIMESHEET_TEMPLATE_ID=1-Eu_KkaQIHAW6uzK0npZ-gQgndmDZTj0snBhjxoFKqE
NEXT_PUBLIC_MASTER_DRIVE_FOLDER=10IyZIezSZd7w7QAcGjGUa063mryg65fe
```

### 3. Set Up Google Apps Script

1. Go to https://script.google.com
2. Create a new project
3. Copy the code from `google-apps-script/Code.gs` (see below)
4. Deploy as web app:
   - Click "Deploy" > "New deployment"
   - Select "Web app"
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
   - Copy the web app URL and add it to `.env.local` as `NEXT_PUBLIC_GAS_ENDPOINT`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Google Apps Script Code

Create a new Google Apps Script project and paste the following code:

```javascript
// Google Apps Script for Heavy D Admin Dashboard
// Deploy as web app with "Execute as: Me" and "Who has access: Anyone"

const MASTER_SHEET_ID = '1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU';
const CALCULATOR_SHEET_ID = '1_jLOhyotUzNNmfrzGpH9tRoO06LOsiCFaaRKaSWcjVU';
const EXPENSE_SHEET_ID = '1g_F1nDhv_lLrEWarvRa0gU_0Tulq30AxBL6-o-VbWWg';
const TIMESHEET_TEMPLATE_ID = '1-Eu_KkaQIHAW6uzK0npZ-gQgndmDZTj0snBhjxoFKqE';
const MASTER_SHEET_NAME = 'Master';
const PRICE_SHEET_NAME = 'Price';
const CALCULATOR_SHEET_NAME = 'Calculator';
const EXPENSE_SHEET_NAME = 'Expenses';

// Main handler for GET requests
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (!action) {
      return createResponse(false, 'No action specified');
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
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

// Helper function to create JSON response
function createResponse(success, message, data = {}) {
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
      return createResponse(false, 'Master sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const clients = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[3]) continue; // Check if Name column is empty
      
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
        briefLink: row[12] || '',
        estimateLink: row[13] || '',
        revisionCode: row[14] || '',
        uploadLink: row[16] || '',
        quoteLink: row[17] || '',
        receiptLink: row[18] || '',
        notes: row[19] || '',
        timeAmount: row[20] || '',
        timesheetLink: row[21] || '',
        accessCode: row[14] || String(i),
        rowIndex: i
      };
      
      clients.push(client);
    }
    
    return createResponse(true, 'Clients loaded successfully', { clients });
  } catch (error) {
    Logger.log('Error in getAllClients: ' + error.toString());
    return createResponse(false, 'Error loading clients: ' + error.toString());
  }
}

// Get single client by code (checks column P - revisionCode)
function getClient(code) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Master sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Check if revision code (column P, index 14) matches
      if (row[14] == code) {
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
          briefLink: row[12] || '',
          estimateLink: row[13] || '',
          revisionCode: row[14] || '',
          uploadLink: row[16] || '',
          quoteLink: row[17] || '',
          receiptLink: row[18] || '',
          notes: row[19] || '',
          timeAmount: row[20] || '',
          timesheetLink: row[21] || '',
          accessCode: row[14] || String(i),
          rowIndex: i
        };
        
        return createResponse(true, 'Client found', { client });
      }
    }
    
    return createResponse(false, 'Client not found');
  } catch (error) {
    Logger.log('Error in getClient: ' + error.toString());
    return createResponse(false, 'Error loading client: ' + error.toString());
  }
}

// Get all expenses and calculate total
function getAllExpenses() {
  try {
    const ss = SpreadsheetApp.openById(EXPENSE_SHEET_ID);
    const sheet = ss.getSheetByName(EXPENSE_SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Expenses sheet not found');
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
    
    return createResponse(true, 'Expenses loaded successfully', { 
      expenses, 
      totalExpenses 
    });
  } catch (error) {
    Logger.log('Error in getAllExpenses: ' + error.toString());
    return createResponse(false, 'Error loading expenses: ' + error.toString());
  }
}

// Get calculator data from Price sheet
function getCalculatorData() {
  try {
    const ss = SpreadsheetApp.openById(CALCULATOR_SHEET_ID);
    const sheet = ss.getSheetByName(PRICE_SHEET_NAME) || ss.getSheetByName(CALCULATOR_SHEET_NAME);
    
    if (!sheet) {
      return createResponse(false, 'Calculator sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Parse materials (rows 2-7)
    const materials = [];
    for (let i = 1; i <= 6; i++) {
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
    
    const calculatorData = {
      materials
    };
    
    return createResponse(true, 'Calculator data loaded', { data: calculatorData });
  } catch (error) {
    Logger.log('Error in getCalculatorData: ' + error.toString());
    return createResponse(false, 'Error loading calculator data: ' + error.toString());
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
      return createResponse(false, 'Calculator sheet not found');
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
    
    return createResponse(true, 'Price calculated', { calculation });
  } catch (error) {
    Logger.log('Error in calculateStickerPrice: ' + error.toString());
    return createResponse(false, 'Error calculating price: ' + error.toString());
  }
}

// Get time entries for a client
function getTimeEntries(code) {
  try {
    // Get client to find their timesheet
    const clientResponse = JSON.parse(getClient(code).getContent());
    
    if (!clientResponse.success || !clientResponse.client.timesheetLink) {
      return createResponse(true, 'No timesheet found', { entries: [] });
    }
    
    // Extract sheet ID from timesheet link
    const timesheetId = extractSheetId(clientResponse.client.timesheetLink);
    
    if (!timesheetId) {
      return createResponse(false, 'Invalid timesheet link');
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
        duration: row[5] || 0
      });
    }
    
    return createResponse(true, 'Time entries loaded', { entries });
  } catch (error) {
    Logger.log('Error in getTimeEntries: ' + error.toString());
    return createResponse(false, 'Error loading time entries: ' + error.toString());
  }
}

// Add time entry to client's timesheet
function addTimeEntry(params) {
  try {
    const code = params.code;
    
    // Get client to find their timesheet
    const clientResponse = JSON.parse(getClient(code).getContent());
    
    if (!clientResponse.success || !clientResponse.client.timesheetLink) {
      return createResponse(false, 'No timesheet found for this client');
    }
    
    const timesheetId = extractSheetId(clientResponse.client.timesheetLink);
    const ss = SpreadsheetApp.openById(timesheetId);
    const sheet = ss.getSheets()[0];
    
    // Add new row
    sheet.appendRow([
      params.date,
      params.startTime,
      params.endTime,
      params.task,
      params.notes,
      params.duration
    ]);
    
    return createResponse(true, 'Time entry added successfully');
  } catch (error) {
    Logger.log('Error in addTimeEntry: ' + error.toString());
    return createResponse(false, 'Error adding time entry: ' + error.toString());
  }
}

// Create timesheet for a client
function createTimesheet(code, clientName) {
  try {
    // Copy the template
    const template = SpreadsheetApp.openById(TIMESHEET_TEMPLATE_ID);
    const newSheet = template.copy(clientName + ' - Timesheet');
    const newSheetId = newSheet.getId();
    const newSheetUrl = newSheet.getUrl();
    
    // Update the Master sheet with the new timesheet link
    const masterSs = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterSheet = masterSs.getSheetByName(MASTER_SHEET_NAME);
    const data = masterSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][14] == code) { // Column P (revision code)
        masterSheet.getRange(i + 1, 22).setValue(newSheetUrl); // Column V (timesheet link)
        break;
      }
    }
    
    return createResponse(true, 'Timesheet created successfully', { 
      timesheetUrl: newSheetUrl 
    });
  } catch (error) {
    Logger.log('Error in createTimesheet: ' + error.toString());
    return createResponse(false, 'Error creating timesheet: ' + error.toString());
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
      return createResponse(false, 'Error loading time entries');
    }
    
    const entries = entriesResponse.entries || [];
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = totalMinutes / 60;
    
    return createResponse(true, 'Total hours calculated', { totalHours });
  } catch (error) {
    return createResponse(false, 'Error calculating total hours: ' + error.toString());
  }
}
```

## Project Structure

```
heavy-d-admin/
├── app/
│   ├── dashboard/
│   │   ├── clients/
│   │   │   └── page.tsx          # Client management page
│   │   ├── tools/
│   │   │   ├── calculator/
│   │   │   │   └── page.tsx      # Pricing calculator
│   │   │   └── timesheet/
│   │   │       └── page.tsx      # Timesheet tracker
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── page.tsx              # Dashboard overview
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirects to dashboard)
├── components/
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── api.ts                    # API integration with Google Apps Script
│   └── utils.ts                  # Utility functions
├── public/                       # Static assets
├── .env.local                    # Environment variables (create this)
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Backend**: Google Apps Script (Sheets API)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- Make sure your Google Apps Script is deployed as a web app with proper permissions
- The Master sheet should have columns matching the structure in your spreadsheet
- Update the sheet IDs in `.env.local` to match your actual Google Sheets
- For production, consider adding authentication/authorization

## Support

For issues or questions, refer to your Google Sheets structure and ensure the Apps Script has the correct column mappings.
