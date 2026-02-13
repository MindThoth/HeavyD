function updateRevisionLinksFromServiceFolder() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getDataRange().getValues();

  const SERVICE_FOLDER_COL = 11; // Column L
  const REVISION_URL_COL = 14;   // Column O
  const LAST_REVISION_NUM_COL = 20; // Column U

  let sentCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const serviceUrl = data[i][SERVICE_FOLDER_COL];
    if (!serviceUrl) {
      skippedCount++;
      continue;
    }

    try {
      const folderIdMatch = serviceUrl.match(/[-\w]{25,}/);
      if (!folderIdMatch) throw new Error("Invalid folder URL format.");

      const serviceFolder = DriveApp.getFolderById(folderIdMatch[0]);
      const revisionsIterator = serviceFolder.getFoldersByName("Revisions");
      if (!revisionsIterator.hasNext()) throw new Error("Revisions folder not found.");
      const revisionsFolder = revisionsIterator.next();

      const revisionFolders = [];
      const subFolders = revisionsFolder.getFolders();
      while (subFolders.hasNext()) {
        const folder = subFolders.next();
        const name = folder.getName();
        if (/^\d+$/.test(name)) {
          revisionFolders.push({ name: parseInt(name), folder });
        }
      }

      if (revisionFolders.length === 0) throw new Error("No numbered revision folders found.");

      revisionFolders.sort((a, b) => b.name - a.name);
      const latest = revisionFolders[0];
      const latestNumber = latest.name;
      const latestFolder = latest.folder;
      const latestUrl = latestFolder.getUrl();

      const storedRevision = parseInt(data[i][LAST_REVISION_NUM_COL] || 0);

      if (latestNumber > storedRevision) {
        latestFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        sheet.getRange(i + 1, REVISION_URL_COL + 1).setValue(latestUrl);
        sheet.getRange(i + 1, LAST_REVISION_NUM_COL + 1).setValue(latestNumber);

        sendRevisionEmailFromRow(i);
        sentCount++;
      } else {
        skippedCount++;
      }

    } catch (err) {
      skippedCount++;
    }
  }

  SpreadsheetApp.flush();

  // ✅ Show popup summary
  const ui = SpreadsheetApp.getUi();
  ui.alert(`Revision Scan Completed`, `${sentCount} email(s) sent.\n${skippedCount} row(s) skipped or unchanged.`, ui.ButtonSet.OK);
}


function sendRevisionEmailFromRow(rowIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
  const data = sheet.getRange(rowIndex + 1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const clientName = data[3];
  const email = data[5];
  const language = (data[7] || "").toLowerCase();
  const accessCode = data[15];
  const revisionUrl = data[14];
  const dashboardUrl = `https://clients.heavydetailing.com/?email=${encodeURIComponent(email)}&code=${encodeURIComponent(accessCode)}`;

  if (!revisionUrl || !email) {
    console.log(`❌ Missing email or revision URL at row ${rowIndex + 1}`);
    return;
  }

  const folderIdMatch = revisionUrl.match(/[-\w]{25,}/);
  if (!folderIdMatch) {
    console.log(`❌ Invalid folder ID at row ${rowIndex + 1}`);
    return;
  }

  const revisionFolder = DriveApp.getFolderById(folderIdMatch[0]);
  const folderName = revisionFolder.getName();
  const revisionNumber = parseInt(folderName);

  const attachments = [];
  const files = revisionFolder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType().startsWith("image/")) {
      attachments.push(file.getBlob());
    }
  }

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    font-weight: bold;
    border-radius: 6px;
    text-decoration: none;
    font-family: sans-serif;
    margin: 10px 0;
  `;
  const blueButton = `${buttonStyle} background-color: #000050; color: white;`;

  const isFrench = ["fr", "french", "français"].includes(language);
  let subject, htmlBody;

  if (revisionNumber === 1) {
    subject = isFrench
      ? "Vos maquettes sont prêtes — Heavy D"
      : "Your Initial Design is Ready — Heavy D";

    htmlBody = isFrench
      ? `
        Bonjour ${clientName},<br><br>
        Vos premières maquettes sont prêtes !<br>
        Veuillez consulter les visuels ci-joints que nous avons préparés pour vous.<br><br>
        🔑 Accédez à votre tableau de bord personnalisé pour suivre la progression et consulter les futures révisions :<br>
        <a href="${dashboardUrl}" style="${blueButton}">Aller au tableau de bord</a><br><br>
        Votre code d'accès : <b>${accessCode}</b><br><br>
        Merci !<br><b>L’équipe Heavy D</b>
      `
      : `
        Hi ${clientName},<br><br>
        Your initial design is now ready!<br>
        You can preview the visuals we've prepared for you below.<br><br>
        🔑 Access your personal dashboard to track progress and view all future revisions:<br>
        <a href="${dashboardUrl}" style="${blueButton}">Go to My Dashboard</a><br><br>
        Your access code: <b>${accessCode}</b><br><br>
        Thank you!<br><b>Heavy D Print & Design</b>
      `;
  } else {
    subject = isFrench
      ? `Révision #${revisionNumber - 1} disponible — Heavy D`
      : `Revision #${revisionNumber - 1} Ready — Heavy D`;

    htmlBody = isFrench
      ? `
        Bonjour ${clientName},<br><br>
        Votre révision numéro ${revisionNumber - 1} est maintenant disponible !<br>
        Nous avons effectué les modifications demandées.<br><br>
        🔑 Accédez à votre tableau de bord personnalisé pour consulter cette révision :<br>
        <a href="${dashboardUrl}" style="${blueButton}">Aller au tableau de bord</a><br><br>
        Votre code d'accès : <b>${accessCode}</b><br><br>
        Merci !<br><b>L’équipe Heavy D</b>
      `
      : `
        Hi ${clientName},<br><br>
        Your revision #${revisionNumber - 1} is now available!<br>
        We've made the requested updates to your design.<br><br>
        🔑 Click below to view it on your personal dashboard:<br>
        <a href="${dashboardUrl}" style="${blueButton}">Go to My Dashboard</a><br><br>
        Your access code: <b>${accessCode}</b><br><br>
        Thank you!<br><b>Heavy D Print & Design</b>
      `;
  }

  GmailApp.sendEmail(email, subject, '', {
  htmlBody: htmlBody,
  attachments: attachments
});

  console.log(`✅ Email sent to ${email} for revision ${revisionNumber}`);
}
