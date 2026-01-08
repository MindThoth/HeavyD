// UPDATED GOOGLE APPS SCRIPT - PREVENTS DOUBLE EXECUTION AND REMOVES "@" FROM FOLDER NAMES
function doPost(e) {
  const executionId = Utilities.getUuid();
  console.log(`Starting execution ${executionId}`);

  try {
    let data;

    // Parse incoming data
    try {
      if (e.postData && e.postData.contents) {
        console.log(`${executionId}: Parsing JSON data`);
        data = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        console.log(`${executionId}: Using URL parameters`);
        data = e.parameter;
      } else {
        throw new Error("No data received");
      }
    } catch (parseError) {
      console.log(`${executionId}: JSON parsing failed, using URL parameters:`, parseError);
      data = e.parameter || {};
    }

    data.executionId = executionId;
    console.log(`${executionId}: Processing data for ${data.name || "Unknown"}`);

    const spreadsheet = SpreadsheetApp.openById("1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU");

    const clientName  = data.name || "Unknown Name";
    const companyName = data.company || "Unknown Company";

    // Normalize service
    const projectTypeRaw = data.service || "Other";
    const projectType    = String(projectTypeRaw).toLowerCase().trim();

    // Boat detection + names
    const isBoat        = projectType === "boat-lettering";
    const boatNameRaw   = (data.boatName || data.boat || "").toString().trim();
    const boatNameClean = cleanFolderName(boatNameRaw || "UnnamedBoat");

    // What to DISPLAY in Master + emails:
    // - Boat: boat name (human-friendly raw) or "Unnamed Boat"
    // - Other: pretty service label (e.g., "Sticker")
    const displayService = isBoat ? (boatNameRaw || "Unnamed Boat")
                                  : prettyServiceName(projectType);

    // Duplicate check (last 5 minutes)
    const masterSheet = spreadsheet.getSheetByName("Master");
    if (masterSheet) {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const lastRow = masterSheet.getLastRow();
      if (lastRow > 1) {
        const checkRows = Math.min(10, lastRow - 1);
        const range = masterSheet.getRange(lastRow - checkRows + 1, 1, checkRows, 17);
        const values = range.getValues();

        for (let i = 0; i < values.length; i++) {
          const rowData = values[i];
          const timestamp = rowData[0];
          const existingName = rowData[3];
          const existingEmail = rowData[5];
          const existingService = rowData[8];

          if (
            timestamp > fiveMinutesAgo &&
            existingName === clientName &&
            existingEmail === data.email &&
            existingService === displayService
          ) {
            console.log(`${executionId}: Duplicate submission detected, skipping`);
            return createCORSResponse(JSON.stringify({
              result: "success",
              message: "Submission already processed",
              isDuplicate: true,
            }));
          }
        }
      }
    }

    // Ensure per-service sheet exists
    const sheetName = getSheetNameByService(projectType);
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

    // Create folders (STRICT naming: no "@", boat=name only; others=pretty service only)
    const folderData = createClientFolderStructure(clientName, companyName, projectType, boatNameClean);
    const serviceFolder = folderData.serviceFolder;
    const uploadsFolder = folderData.uploadsFolder;
    const isNewClient = folderData.isNewClient;

    const folderUrl = serviceFolder.getUrl();
    uploadsFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    const uploadLink = uploadsFolder.getUrl();

    const briefUrl = createClientBriefDoc(data, serviceFolder, isNewClient);

    // Detect "has files"
    const hasFiles =
      data.hasFiles === "true" ||
      data.hasLogoFiles === "yes" ||
      data.hasExistingDesignFiles === "yes" ||
      data.hasBoatPhotos === "yes" ||
      data.hasVehiclePhotos === "yes" ||
      data.hasMagnetDesign === "yes" ||
      (data.stickers && Array.isArray(data.stickers) &&
        data.stickers.some((s) => s.hasStickerVisuals === "yes")) ||
      (typeof data.stickers === "string" && data.stickers.includes('"hasStickerVisuals":"yes"'));

    // Flatten data for sheet append
    const processedData = {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      processedData[key] = (Array.isArray(value) || (typeof value === "object" && value !== null))
        ? JSON.stringify(value) : value;
    });

    const fieldKeys = Object.keys(processedData);
    const headers = ["Timestamp", ...fieldKeys, "Company Folder URL", "Upload Link"];

    if (sheet.getLastRow() === 0) sheet.appendRow(headers);

    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = existingHeaders.map((h) => {
      if (h === "Timestamp") return new Date();
      if (h === "Company Folder URL") return folderUrl;
      if (h === "Upload Link") return uploadLink;
      return processedData[h] || "";
    });
    sheet.appendRow(row);

    // Write to Master
    if (!masterSheet) throw new Error("Master sheet not found.");

    const accessCode = Math.floor(1000 + Math.random() * 9000);
    masterSheet.appendRow([
      new Date(),         // A
      "New",              // B
      "",                 // C
      clientName,         // D
      companyName,        // E
      data.email || "",   // F
      data.phone || "",   // G
      data.preferredLanguage || "", // H
      displayService,     // I (boat: boat name; other: pretty service)
      "", "",             // J, K
      folderUrl,          // L
      briefUrl,           // M
      "", "",             // N, O
      accessCode,         // P
      uploadLink,         // Q
      "", "", "", "", ""  // R..V
    ]);

    // Admin email
    try {
      MailApp.sendEmail(
        "info@heavydetailing.com",
        `New ${displayService} submission - ${clientName} [${executionId}]`,
        "",
        {
          htmlBody: `
            <p><strong>Execution ID:</strong> ${executionId}</p>
            <p><strong>Client:</strong> ${clientName}<br>
            <strong>Company:</strong> ${companyName}<br>
            <strong>Service (key):</strong> ${projectType}</p>
            <p><strong>Drive Folder:</strong> <a href="${folderUrl}">${folderUrl}</a><br>
            <strong>Brief:</strong> <a href="${briefUrl}">${briefUrl}</a><br>
            ${hasFiles ? `<strong>Upload Link:</strong> <a href="${uploadLink}">${uploadLink}</a><br>` : ""}
            </p>
            <pre style="font-size:12px;">${JSON.stringify(data, null, 2)}</pre>
          `,
        }
      );
      console.log(`${executionId}: Admin notification sent`);
    } catch (emailError) {
      console.log(`${executionId}: Admin email failed:`, emailError);
    }

    // Client email (optional)
    if (data.email) {
      try {
        const lang = (data.preferredLanguage || "").toLowerCase();
        const isFrench = lang === "fr" || lang === "french" || lang === "français";
        const subject = isFrench
          ? "Heavy D - Instructions pour téléverser vos fichiers"
          : "Heavy D - File Upload Instructions";
        const body = isFrench
          ? `Bonjour ${clientName},\n\nMerci pour votre demande de soumission! Nous avons bien reçu les informations concernant votre projet "${projectType}".\n\nPour nous transmettre vos fichiers, veuillez utiliser ce lien sécurisé :\n${uploadLink}\n\nGlissez-déposez vos fichiers dans ce dossier. Nous vous reviendrons dans un délai de 24 heures.\n\nCordialement,\nL'équipe de Heavy D Print & Design\n\nRéférence: ${executionId}`
          : `Hi ${clientName},\n\nThank you for your quote request! We've received your information for ${projectType}.\n\nTo upload your files, please use this secure link:\n${uploadLink}\n\nSimply drag & drop your files into the folder. We'll review and respond within 24 hours.\n\nBest regards,\nHeavy D Print & Design Team\n\nReference: ${executionId}`;

        MailApp.sendEmail(data.email, subject, "", { htmlBody: body.replace(/\n/g, "<br>") });
        console.log(`${executionId}: Client notification sent`);
      } catch (clientEmailError) {
        console.log(`${executionId}: Client email failed:`, clientEmailError);
      }
    }

    console.log(`${executionId}: Execution completed successfully`);
    return createCORSResponse(JSON.stringify({
      result: "success",
      uploadLink,
      executionId,
      message: hasFiles ? "Please check your email for file upload instructions" : "Form submitted successfully",
    }));

  } catch (error) {
    console.log(`Execution ${executionId} failed:`, error.toString());
    return createCORSResponse(JSON.stringify({
      result: "error",
      error: error.toString(),
      executionId,
    }));
  }
}

function doGet(e) {
  console.log("doGet called");
  return createCORSResponse(JSON.stringify({
    result: "success",
    message: "Google Apps Script is working! Use POST method to submit form data.",
  }));
}

function doOptions(e) {
  console.log("doOptions called for CORS preflight");
  return createCORSResponse("");
}

function createCORSResponse(content) {
  const output = ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  output.setHeader("Access-Control-Max-Age", "3600");
  return output;
}

// Sheet tab names (for per-service sheets)
function getSheetNameByService(service) {
  const mapping = {
    "logo-design": "Logo",
    "vehicle-lettering": "Vehicle",
    "boat-lettering": "Boat",
    "drone-photography": "Drone",
    "car-magnets": "Magnet",
    "stickers": "Stickers",
  };
  return mapping[service] || titleCase(service.replace(/-/g, " "));
}

/**
 * STRICT folder naming:
 *  - Boat lettering:     folder = boat name only
 *  - Other services:     folder = pretty service label only (e.g., "Sticker")
 *  Absolutely no "@"
 */
function createClientFolderStructure(clientName, companyName, projectType, boatName) {
  const masterFolderName = "Heavy D Master";
  const baseFolderName   = "Clients";

  const cleanClientName  = cleanFolderName(clientName);
  const cleanCompanyName = cleanFolderName(companyName);
  const serviceKey       = cleanFolderName(String(projectType).toLowerCase());

  // Resolve base project folder name
  // - Boat: boatName only (already cleaned)
  // - Other: pretty service label (human friendly)
  const isBoat = serviceKey === "boat-lettering";
  const baseProjectName = isBoat
    ? (boatName || "UnnamedBoat")
    : cleanFolderName(prettyServiceName(serviceKey)); // ensure no '@' even if pretty map changes later

  // Locate / create parent folders
  const folders = DriveApp.getFoldersByName(masterFolderName);
  if (!folders.hasNext()) throw new Error("Folder 'Heavy D Master' not found.");
  const masterFolder = folders.next();

  const clientsFolder = masterFolder.getFoldersByName(baseFolderName).hasNext()
    ? masterFolder.getFoldersByName(baseFolderName).next()
    : masterFolder.createFolder(baseFolderName);

  const clientFolderIt = clientsFolder.getFoldersByName(cleanClientName);
  const clientFolderExists = clientFolderIt.hasNext();
  const clientFolder = clientFolderExists ? clientFolderIt.next() : clientsFolder.createFolder(cleanClientName);

  const companyFolder = clientFolder.getFoldersByName(cleanCompanyName).hasNext()
    ? clientFolder.getFoldersByName(cleanCompanyName).next()
    : clientFolder.createFolder(cleanCompanyName);

  // Guarantee no '@' (belt & suspenders)
  let projectFolderName = String(baseProjectName).replace(/@/g, "");
  if (!projectFolderName) projectFolderName = isBoat ? "UnnamedBoat" : "Project";

  // Ensure uniqueness by suffixing _2, _3, ...
  let suffix = 2;
  while (companyFolder.getFoldersByName(projectFolderName).hasNext()) {
    projectFolderName = `${baseProjectName}_${suffix}`.replace(/@/g, "");
    suffix++;
  }

  const projectFolder   = companyFolder.createFolder(projectFolderName);
  const uploadsFolder   = projectFolder.createFolder("Uploads");
  const revisionsFolder = projectFolder.createFolder("Revisions");

  return {
    companyFolder,
    serviceFolder: projectFolder,
    uploadsFolder,
    revisionsFolder,
    isNewClient: !clientFolderExists,
  };
}

function createClientBriefDoc(data, serviceFolder, isNewClient) {
  const companyName = data.company || "Unknown Company";
  const serviceName = data.service || "Service";
  const docName = `Brief - ${companyName} - ${serviceName}`;

  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  body.appendParagraph(docName).setHeading(DocumentApp.ParagraphHeading.HEADING1);

  if (data.executionId) body.appendParagraph(`Execution ID: ${data.executionId}`).setBold(true);

  const fields = ["name", "company", "email", "phone", "service", "preferredLanguage"];
  fields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== "") {
      body.appendParagraph(`${capitalize(field)}: ${data[field]}`);
    }
  });

  body.appendParagraph(`NewClient: ${isNewClient ? "Yes" : "No"}`).setBold(true);

  const answeredExtras = Object.keys(data).filter(
    (key) => !fields.includes(key) && key !== "executionId" && data[key] && data[key].toString().trim() !== ""
  );

  if (answeredExtras.length > 0) {
    body.appendParagraph("\n--- Form Answers ---\n").setBold(true);
    answeredExtras.forEach((key) => {
      const value = data[key];

      if (key === "stickers") {
        let stickersData = value;
        if (typeof value === "string") {
          try { stickersData = JSON.parse(value); } catch (e) {
            body.appendParagraph(`${capitalize(key)}: ${value}`);
            return;
          }
        }
        if (Array.isArray(stickersData)) {
          body.appendParagraph(`${capitalize(key)}:`).setBold(true);
          stickersData.forEach((sticker, index) => {
            body.appendParagraph(`  Sticker ${index + 1}:`);
            Object.keys(sticker).forEach((k) => {
              if (sticker[k] && sticker[k].toString().trim() !== "") {
                body.appendParagraph(`    ${capitalize(k)}: ${sticker[k]}`);
              }
            });
            body.appendParagraph("");
          });
          return;
        }
      }

      if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        body.appendParagraph(`${capitalize(key)}: ${JSON.stringify(value, null, 2)}`);
      } else {
        body.appendParagraph(`${capitalize(key)}: ${value}`);
      }
    });
  }

  const file = DriveApp.getFileById(doc.getId());
  serviceFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return doc.getUrl();
}

// --- Helpers ---
function prettyServiceName(serviceKey) {
  // Map known keys to pretty, singular labels
  const map = {
    "stickers": "Sticker",
    "sticker": "Sticker",
    "vehicle-lettering": "Vehicle",
    "logo-design": "Logo",
    "car-magnets": "Magnet",
    "drone-photography": "Drone",
    "boat-lettering": "Boat", // only used for display elsewhere; folder uses boat name
    "other": "Other"
  };
  const pretty = map[serviceKey];
  if (pretty) return pretty;
  // Default: Title Case words
  return titleCase(serviceKey.replace(/-/g, " "));
}

function cleanFolderName(name) {
  return String(name || "")
    .replace(/@/g, "")                 // remove all '@'
    .replace(/[<>:"/\\|?*]/g, "_")     // illegal chars -> underscore
    .trim()
    .replace(/\s+/g, "_")              // spaces -> underscore
    .replace(/_+/g, "_")               // collapse multiple underscores
    .replace(/^_+|_+$/g, "");          // trim leading/trailing underscores
}

function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .split(" ")
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : "")
    .join(" ");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMasterSheetRowNumberForClient(clientName) {
  const sheet = SpreadsheetApp.openById("1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU").getSheetByName("Master");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === clientName) return i + 1;
  }
  throw new Error("Client not found in Master sheet.");
}

