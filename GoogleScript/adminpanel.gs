// FINAL FULL SCRIPT — ESTIMATION, SENDING & APPROVAL FLOW WITH 'Estimation' + 'Quote' SHEETS

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Actions')
    .addItem('🧮 Generate Estimation', 'triggerEstimation')
    .addItem('✅ Approve First Estimate', 'approveThisEstimate')
    .addItem('📋 Approve All Estimates', 'approveAllEstimates')
    .addItem('📤 Send Quote to Client', 'sendQuoteToClient')
    .addItem('🎉 Client Approved', 'clientApprovedQuote')
    .addItem('🗂️ Update Revisions', 'updateRevisionLinksFromServiceFolder')
    .addItem('🧾 Send Receipt', 'sendReceiptToClient')
    .addItem('💵 Paid Selected Row', 'markActiveRowAsPaid')
    .addSeparator()
    .addItem('🙈 Hide Paid Rows', 'hidePaidRows')
    .addItem('👀 Show Paid Rows', 'showPaidRows')
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
    'revamp', 'redo', 'refaire', 'rafraîchir', 'rafraichir', 'moderniser',
    'rebranding', 'mise à jour', 'mise a jour', 'rafraichissement', 'remise à jour',
    'update', 'modifier logo', 'revoir le logo', 'retravail', 'ajustement', 'améliorer le logo',
    'améliorer', 'amélioration du logo', 'révision'
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
      packageItem = lang === 'fr' ? "Forfait logo — Révision" : "Logo Package — Redesign";
      cost = 75; price = 300;
      description = lang === 'fr'
        ? "- 1 concept de logo\n- 1 ronde de révision\n- Fichiers finaux : JPG, PNG, PDF\n- Versions noir/blanc et transparentes"
        : "- 1 logo concept\n- 1 revision round\n- Final files: JPG, PNG, PDF\n- Black/white and transparent versions";
    } else if (isNewClient || hasLogoFiles === "no" || imageInMind) {
      packageItem = lang === 'fr' ? "Forfait logo — Branding Complet" : "Logo Package — Full Branding";
      cost = 125; price = 500;
      description = lang === 'fr'
        ? "- 2 concepts de logo\n- 2 rondes de révision\n- Palette de couleurs (Pantone)\n- Polices (avec fichiers)\n- Fichiers finaux : JPG, PNG, PDF, SVG, CDR, AI\n- Versions noir/blanc, transparentes et réseaux sociaux"
        : "- 2 logo concepts\n- 2 revision rounds\n- Color palette (Pantone)\n- Fonts (with files)\n- Final files: JPG, PNG, PDF, SVG, CDR, AI\n- Black/white, transparent & social media versions";
    } else {
      packageItem = lang === 'fr' ? "Forfait logo — De base" : "Logo Package — Basic";
      cost = 75; price = 300;
      description = lang === 'fr'
        ? "- 1 concept de logo\n- 1 ronde de révision\n- Fichiers finaux : JPG, PNG, PDF\n- Versions noir/blanc et transparentes"
        : "- 1 logo concept\n- 1 revision round\n- Final files: JPG, PNG, PDF\n- Black/white and transparent versions";
    }

    matchedRows.push([packageItem, 1, cost, price]);
    matchedRows.push([description, "", "", ""]);

    if (/extra|concept/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "Concept supplémentaire" : "Extra Logo Concept", 1, 25, 100]);
    }
    if (/icon|icône/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "Conception d’icône" : "Custom Icon Design", 1, 10, 40]);
    }
    if (/revision|révision|modif/i.test(extraInfo)) {
      matchedRows.push([lang === 'fr' ? "Révision additionnelle" : "Additional Revision", 1, 10, 30]);
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

  // Column J (10): Cost — hyperlink text is live from the Estimation total
  masterSheet.getRange(rowIndex, 10).setFormula(
    `=HYPERLINK("${linkUrl}", "$"&TEXT(IMPORTRANGE("${fileId}","${costA1}"), "#,##0.00"))`
  );

  // Column K (11): Price — hyperlink text is live from the Estimation total
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



function cleanFolderName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim().replace(/\s+/g, "_");
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
    if (status !== "Estimate Approved") continue; // ✅ Only process approved rows

    const clientName = data[i][3];
    const clientEmail = data[i][5];
    const language = (data[i][7] || "").toLowerCase();
    const service = data[i][8];
    const serviceFolderUrl = data[i][11];
    const fileId = data[i][13];
    const accessCode = data[i][15];

    if (!fileId) {
      Logger.log(`Missing fileId at row ${i + 1}, skipping.`);
      continue; // ✅ Prevent invalid argument error
    }

    const folderId = serviceFolderUrl.match(/[-\w]{25,}/)?.[0];
    if (!folderId) {
      Logger.log(`Invalid folder URL at row ${i + 1}, skipping.`);
      continue;
    }

    const QUOTE_TEMPLATE_ID = ["fr", "french", "français"].includes(language)
      ? "1ARtgQL2YG5vgMsDqX5a7_zSQy8jTlFWfn_bbYp-6BrY"
      : "1qArSmTeLy6C62KZSWxqM2oGWN-JzkzSFnsgj-HHJ-Vo";

    const estimateFile = SpreadsheetApp.openById(fileId);
    const quoteSheet = estimateFile.getSheetByName("Quote");
    if (!quoteSheet) {
      Logger.log(`Missing 'Quote' sheet in estimate at row ${i + 1}, skipping.`);
      continue;
    }

    const rawValues = quoteSheet.getRange(2, 1, 20, 3).getValues();
    const skipKeywords = ["subtotal", "total", "tax", "note", "comment", "remarque", "total général"];
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

    const acceptUrl = `https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec?action=acceptEmail&email=${encodeURIComponent(clientEmail)}&accessCode=${encodeURIComponent(accessCode)}`;
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
    if (["fr", "french", "français"].includes(language)) {
      subject = `Votre soumission de Heavy D — ${service}`;
      htmlBody = `
        Bonjour ${clientName},<br><br>
        Voici votre soumission pour le service <b>${service}</b>.<br>
        Veuillez consulter le PDF ci-joint.<br><br>

        ✅ Cliquez ci-dessous pour accepter votre soumission :<br>
        <a href="${acceptUrl}" style="${greenButton}">Accepter la soumission</a><br><br>

        🗂️ Accédez à votre tableau de bord personnalisé pour voir tous vos designs futurs :<br>
        <a href="${dashboardUrl}" style="${blueButton}">Aller au tableau de bord</a><br><br>

        Votre code d'accès : <b>${accessCode}</b><br><br>

        Merci !<br>
        <b>L’équipe Heavy D</b>
      `;
    } else {
      subject = `Your Quote from Heavy D — ${service}`;
      htmlBody = `
        Hi ${clientName},<br><br>
        Here is your quote for the service <b>${service}</b>.<br>
        Please find the attached PDF.<br><br>

        ✅ Click below to accept your quote:<br>
        <a href="${acceptUrl}" style="${greenButton}">Accept Quote</a><br><br>

        🗂️ You can also access your personal dashboard to view all future designs:<br>
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

    sheet.getRange(i + 1, 2).setValue("Quote Sent"); // ✅ Update status
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
    const skipKeywords = ["subtotal", "total", "tax", "note", "comment", "remarque", "total général"];

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

    const templateId = ["fr", "french", "français"].includes(language) ? RECEIPT_TEMPLATE_FR : RECEIPT_TEMPLATE_EN;
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

    const subject = ["fr", "french", "français"].includes(language)
      ? `Votre reçu de Heavy D — ${service}`
      : `Your Receipt from Heavy D — ${service}`;

    const bodyText = ["fr", "french", "français"].includes(language)
      ? `Bonjour ${clientName},<br><br>Voici votre reçu pour le service <b>${service}</b>.<br>Veuillez consulter le PDF ci-joint.<br><br>Merci pour votre confiance!<br><b>L'équipe Heavy D</b>`
      : `Hi ${clientName},<br><br>Here is your receipt for the service <b>${service}</b>.<br>Please find the attached PDF.<br><br>Thank you for your business!<br><b>Heavy D Print & Design</b>`;

      GmailApp.sendEmail(clientEmail, subject, '', {
        htmlBody: htmlBody,
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
      // ✅ Only allow update if status is "Quote Sent"
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.CLIENTS_SHEET);
  const row = sheet.getActiveRange().getRow();
  markAsPaid(row);
}

function markAsPaid(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.CLIENTS_SHEET);
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
  const receiptFolder = getOrCreateYearFolder(CONFIG.RECEIPT_ROOT_FOLDER_ID, year);
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


