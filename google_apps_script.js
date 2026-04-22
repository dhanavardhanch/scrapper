/**
 * Google Apps Script to save Troogood Invoice data to a Spreadsheet.
 * 1. Open your Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any existing code and paste this.
 * 4. Click 'Deploy' -> 'New Deployment'.
 * 5. Select 'Web App'.
 * 6. Set 'Execute as' to 'Me'.
 * 7. Set 'Who has access' to 'Anyone'.
 * 8. Copy the 'Web App URL' and paste it into the Troogood App settings.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("Script is not bound to a Spreadsheet. Please open your Google Sheet, click Extensions > Apps Script, and paste this code there.");
    }
    
    var sheet = ss.getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    
    var itemsArray = data.items;
    
    if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
      itemsArray.forEach(function(itemObj) {
        sheet.appendRow([
          data.date,
          data.invoice_no,
          data.vendor,
          data.po_number,
          data.gstin,
          data.taxable_value,
          data.cgst,
          data.sgst,
          data.amount,
          data.factory,
          data.type,
          itemObj.name || '', // Only use the specific text in item name
          data.direction
        ]);
      });
    } else {
      // Fallback if structured items were missing
      sheet.appendRow([
        data.date,
        data.invoice_no,
        data.vendor,
        data.po_number,
        data.gstin,
        data.taxable_value,
        data.cgst,
        data.sgst,
        data.amount,
        data.factory,
        data.type,
        data.item || '', // Flattened string fallback 
        data.direction
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Service is running. Use POST to save data.");
}
