/**
 * Google Apps Script function to generate and save PDF from print-view route
 * This goes in your Google Apps Script project
 */

/**
 * Generate PDF from client dashboard and save to Google Drive
 */
function generateClientPDF(email, accessCode, clientName, companyName) {
  try {
    console.log(`Generating PDF for ${clientName} (${email})`)

    // Your client dashboard print-view URL
    const printUrl = `https://clients.heavydetailing.com/print-view?email=${encodeURIComponent(email)}&code=${encodeURIComponent(accessCode)}`

    console.log(`Print URL: ${printUrl}`)

    // Option A: Use PDFShift API (Recommended)
    const pdfBytes = generatePDFWithPDFShift(printUrl)

    // Option B: Alternative - use HTML to PDF service
    // const pdfBytes = generatePDFWithAlternativeService(printUrl);

    if (!pdfBytes) {
      throw new Error("Failed to generate PDF")
    }

    // Create filename
    const timestamp = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const filename = `${clientName.replace(/[^a-zA-Z0-9]/g, "_")}_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Quote_${timestamp}.pdf`

    // Save to Google Drive
    const blob = Utilities.newBlob(pdfBytes, "application/pdf", filename)
    const file = DriveApp.createFile(blob)

    // Optional: Move to specific folder
    const quotesFolder = DriveApp.getFolderById("YOUR_QUOTES_FOLDER_ID") // Replace with your folder ID
    quotesFolder.addFile(file)
    DriveApp.getRootFolder().removeFile(file)

    console.log(`✅ PDF generated and saved: ${filename}`)
    console.log(`File ID: ${file.getId()}`)
    console.log(`File URL: https://drive.google.com/file/d/${file.getId()}/view`)

    return {
      success: true,
      fileId: file.getId(),
      filename: filename,
      url: `https://drive.google.com/file/d/${file.getId()}/view`,
    }
  } catch (error) {
    console.error("Error generating PDF:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generate PDF using PDFShift API
 */
function generatePDFWithPDFShift(url) {
  try {
    const PDFSHIFT_API_KEY = "YOUR_PDFSHIFT_API_KEY" // Get from https://pdfshift.io

    const payload = {
      source: url,
      landscape: false,
      format: "Letter", // 8.5x11 inches
      margin: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in",
      },
      wait: 3000, // Wait 3 seconds for page to load
      sandbox: false,
    }

    const response = UrlFetchApp.fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Utilities.base64Encode(PDFSHIFT_API_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(payload),
    })

    if (response.getResponseCode() === 200) {
      return response.getBlob().getBytes()
    } else {
      throw new Error(`PDFShift API error: ${response.getResponseCode()} - ${response.getContentText()}`)
    }
  } catch (error) {
    console.error("PDFShift error:", error)
    throw error
  }
}

/**
 * Alternative: Generate PDF using HTML/CSS to PDF API
 */
function generatePDFWithAlternativeService(url) {
  try {
    // Example using htmlcsstoimage.com API
    const API_KEY = "YOUR_API_KEY"
    const API_ID = "YOUR_API_ID"

    const payload = {
      url: url,
      format: "pdf",
      width: 816, // 8.5 inches at 96 DPI
      height: 1056, // 11 inches at 96 DPI
      device_scale: 2,
      wait_for_selector: "body",
    }

    const response = UrlFetchApp.fetch("https://hcti.io/v1/image", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Utilities.base64Encode(API_ID + ":" + API_KEY)}`,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(payload),
    })

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText())

      // Download the generated PDF
      const pdfResponse = UrlFetchApp.fetch(result.url)
      return pdfResponse.getBlob().getBytes()
    } else {
      throw new Error(`API error: ${response.getResponseCode()}`)
    }
  } catch (error) {
    console.error("Alternative PDF service error:", error)
    throw error
  }
}

/**
 * Generate PDF for a specific client row in Master sheet
 */
function generatePDFForClientRow(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master")
    const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0]

    const clientName = row[3] // Column D
    const companyName = row[4] // Column E
    const email = row[5] // Column F
    const accessCode = row[15] // Column P

    if (!email || !accessCode) {
      throw new Error("Missing email or access code for client")
    }

    const result = generateClientPDF(email, accessCode, clientName, companyName)

    if (result.success) {
      // Optional: Update the Master sheet with PDF file ID
      sheet.getRange(rowIndex, 18).setValue(result.url) // Column R - PDF URL

      SpreadsheetApp.getUi().alert(
        "PDF Generated Successfully!",
        `PDF has been generated and saved to Google Drive.\n\nFile: ${result.filename}\nURL: ${result.url}`,
        SpreadsheetApp.getUi().Button.OK,
      )
    } else {
      throw new Error(result.error)
    }

    return result
  } catch (error) {
    console.error("Error in generatePDFForClientRow:", error)
    SpreadsheetApp.getUi().alert("PDF Generation Failed", `Error: ${error.message}`, SpreadsheetApp.getUi().Button.OK)
    throw error
  }
}

/**
 * Menu function to add PDF generation to your spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi()
  ui.createMenu("Heavy D Dashboard")
    .addItem("Send Quote to Dashboard", "sendCurrentRowQuote")
    .addSeparator()
    .addItem("Generate PDF", "generatePDFForCurrentRow")
    .addSeparator()
    .addItem("Test Connection", "testDashboardConnection")
    .addToUi()
}

/**
 * Generate PDF for currently selected row
 */
function generatePDFForCurrentRow() {
  const sheet = SpreadsheetApp.getActiveSheet()
  const activeRange = sheet.getActiveRange()
  const currentRow = activeRange.getRow()

  if (currentRow < 2) {
    SpreadsheetApp.getUi().alert("Please select a client row (row 2 or below)")
    return
  }

  try {
    generatePDFForClientRow(currentRow)
  } catch (error) {
    console.error("Error generating PDF:", error)
  }
}

/**
 * Batch generate PDFs for multiple clients
 */
function generatePDFsForAllClients() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master")
    const data = sheet.getDataRange().getValues()
    const results = []

    for (let i = 1; i < data.length; i++) {
      // Skip header row
      const row = data[i]
      const clientName = row[3] // Column D
      const companyName = row[4] // Column E
      const email = row[5] // Column F
      const accessCode = row[15] // Column P

      if (email && accessCode && clientName) {
        try {
          console.log(`Processing ${clientName}...`)
          const result = generateClientPDF(email, accessCode, clientName, companyName)

          if (result.success) {
            // Update PDF URL in sheet
            sheet.getRange(i + 1, 18).setValue(result.url) // Column R
            results.push(`✅ ${clientName}: ${result.filename}`)
          } else {
            results.push(`❌ ${clientName}: ${result.error}`)
          }

          // Add delay to avoid rate limiting
          Utilities.sleep(2000)
        } catch (error) {
          console.error(`Error processing ${clientName}:`, error)
          results.push(`❌ ${clientName}: ${error.message}`)
        }
      }
    }

    console.log("Batch PDF generation results:", results)

    SpreadsheetApp.getUi().alert(
      "Batch PDF Generation Complete",
      `Results:\n${results.join("\n")}`,
      SpreadsheetApp.getUi().Button.OK,
    )
  } catch (error) {
    console.error("Error in batch PDF generation:", error)
    SpreadsheetApp.getUi().alert(
      "Batch PDF Generation Failed",
      `Error: ${error.message}`,
      SpreadsheetApp.getUi().Button.OK,
    )
  }
}

/**
 * Test PDF generation with sample data
 */
function testPDFGeneration() {
  try {
    const result = generateClientPDF("test@example.com", "1234", "Test Client", "Test Company")

    console.log("Test PDF generation result:", result)

    if (result.success) {
      SpreadsheetApp.getUi().alert(
        "Test PDF Generated!",
        `Test PDF created successfully.\nFile: ${result.filename}\nURL: ${result.url}`,
        SpreadsheetApp.getUi().Button.OK,
      )
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error("Test PDF generation failed:", error)
    SpreadsheetApp.getUi().alert("Test Failed", `Error: ${error.message}`, SpreadsheetApp.getUi().Button.OK)
  }
}
