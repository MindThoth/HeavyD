/**
 * Updated sendQuoteToV0 function to work with Heavy D Client Dashboard
 * Place this in your estimate spreadsheet's Apps Script
 */
function sendQuoteToV0(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master")
    const row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0]

    const clientName = row[3] // Column D
    const companyName = row[4] // Column E
    const email = row[5] // Column F
    const service = row[8] // Column I
    const spreadsheetId = row[13] // Column N
    const accessCode = row[15] // Column P

    console.log(`Sending quote data for: ${clientName} (${email})`)

    // Open the estimate spreadsheet
    let finalSpreadsheetId = spreadsheetId
    if (spreadsheetId.includes("spreadsheets")) {
      const spreadsheetIdMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (spreadsheetIdMatch) {
        finalSpreadsheetId = spreadsheetIdMatch[1]
      }
    }

    const estimateSpreadsheet = SpreadsheetApp.openById(finalSpreadsheetId)
    const quoteSheet = estimateSpreadsheet.getSheetByName("Quote")

    if (!quoteSheet) {
      throw new Error("Quote sheet not found")
    }

    // Get quote data - adjust range based on your sheet structure
    const lastRow = quoteSheet.getLastRow()
    const quoteData = quoteSheet.getRange(2, 1, lastRow - 1, 3).getValues() // A2:C
    const quoteItems = []

    for (let i = 0; i < quoteData.length; i++) {
      const [item, quantity, price] = quoteData[i]

      // Stop at TOTAL row or empty rows
      if (!item || item.toString().toUpperCase() === "TOTAL") break

      if (item.toString().trim() !== "") {
        quoteItems.push({
          item: item.toString().trim(),
          quantity: Number.parseFloat(quantity) || 1,
          price: Number.parseFloat(price) || 0,
        })
      }
    }

    // Calculate or get total price
    let totalPrice = 0
    try {
      // Try to get total from the sheet (adjust cell reference as needed)
      const totalRow = quoteItems.length + 2
      totalPrice = quoteSheet.getRange(totalRow, 3).getValue()

      if (typeof totalPrice !== "number" || totalPrice === 0) {
        // Calculate total if not found or zero
        totalPrice = quoteItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
      }
    } catch (error) {
      console.log("Calculating total from items")
      totalPrice = quoteItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
    }

    const payload = {
      clientName,
      companyName,
      service,
      email,
      accessCode,
      totalPrice,
      quoteItems,
      spreadsheetId: finalSpreadsheetId,
    }

    console.log("Payload prepared:", payload)
    console.log(`Found ${quoteItems.length} quote items, total: $${totalPrice}`)

    // Send to Heavy D Client Dashboard endpoint
    const HEAVY_D_ENDPOINT =
      "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

    const response = UrlFetchApp.fetch(HEAVY_D_ENDPOINT, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    })
    const responseText = response.getContentText()

    console.log("Response from Heavy D Dashboard:", responseText)

    try {
      const responseData = JSON.parse(responseText)
      if (responseData.success) {
        console.log(`✅ Quote data sent successfully! Updated ${responseData.itemsUpdated} items.`)

        // Optional: Show success message
        SpreadsheetApp.getUi().alert(
          "Success!",
          `Quote data sent to client dashboard successfully!\n\nClient: ${clientName}\nItems: ${quoteItems.length}\nTotal: $${totalPrice.toFixed(2)}`,
          SpreadsheetApp.getUi().Button.OK,
        )

        return true
      } else {
        throw new Error(responseData.message || "Unknown error from dashboard")
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError)
      throw new Error("Invalid response from dashboard")
    }
  } catch (error) {
    console.error("Error in sendQuoteToV0:", error)

    // Show error message to user
    SpreadsheetApp.getUi().alert(
      "Error",
      `Failed to send quote data: ${error.message}`,
      SpreadsheetApp.getUi().Button.OK,
    )

    throw error
  }
}

/**
 * Helper function to send quote data for multiple rows
 */
function sendMultipleQuotes(startRow, endRow) {
  const results = []

  for (let i = startRow; i <= endRow; i++) {
    try {
      sendQuoteToV0(i)
      results.push(`Row ${i}: Success`)
    } catch (error) {
      results.push(`Row ${i}: Error - ${error.message}`)
    }
  }

  console.log("Batch results:", results)
  return results
}

/**
 * Menu function to add to your spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi()
  ui.createMenu("Heavy D Dashboard")
    .addItem("Send Quote to Dashboard", "sendCurrentRowQuote")
    .addSeparator()
    .addItem("Test Connection", "testDashboardConnection")
    .addToUi()
}

/**
 * Send quote for currently selected row
 */
function sendCurrentRowQuote() {
  const sheet = SpreadsheetApp.getActiveSheet()
  const activeRange = sheet.getActiveRange()
  const currentRow = activeRange.getRow()

  if (currentRow < 2) {
    SpreadsheetApp.getUi().alert("Please select a client row (row 2 or below)")
    return
  }

  try {
    sendQuoteToV0(currentRow)
  } catch (error) {
    console.error("Error sending quote:", error)
  }
}

/**
 * Test connection to dashboard
 */
function testDashboardConnection() {
  try {
    const HEAVY_D_ENDPOINT =
      "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
    }

    const response = UrlFetchApp.fetch(HEAVY_D_ENDPOINT, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(testPayload),
    })
    const responseText = response.getContentText()

    console.log("Test response:", responseText)

    SpreadsheetApp.getUi().alert(
      "Connection Test",
      `Connection successful!\nResponse: ${responseText.substring(0, 100)}...`,
      SpreadsheetApp.getUi().Button.OK,
    )
  } catch (error) {
    console.error("Connection test failed:", error)
    SpreadsheetApp.getUi().alert("Connection Test Failed", `Error: ${error.message}`, SpreadsheetApp.getUi().Button.OK)
  }
}
