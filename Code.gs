function updateSheets() {
  var now = new Date();
  var startDate = new Date(2018, 5, 17, 2);
  ["xyz"].forEach(function(sheetId) { SpreadsheetApp.openById(sheetId).getSheets().forEach(function(sheet) {
    //sheet.clear();
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).sort(1);
    var lastRow = sheet.getMaxRows();
    var lastDate = lastRow?sheet.getRange(lastRow,1).getValue():"";
    for (var start = lastDate?lastDate:startDate, pos = lastDate?(lastRow+1):1; start <= now; start.setDate(start.getDate() + 1)) { // fetch day-wise because of 5000 limit per fetch
      var end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
      var csvUrl = "https://api.hackair.eu/measurements/export?sensor_id=" + sheet.getName() + "&start=" + start.toISOString() + "&end=" + end.toISOString();
      var csvContent = UrlFetchApp.fetch(csvUrl).getContentText();
      var csvData = Utilities.parseCsv(csvContent);
      csvData.shift();
      if (csvData.length !== 0) {
        csvData = csvData.map(function(row){return [row[2], row[3],row[4]];}); // add .replace('.',',') after [4] if spreadsheet language has "," as the decimal sign (eg german)
        for(var i = 0; i < csvData.length/2; i++) {
          csvData[i] = [csvData[i*2][0],csvData[i*2][2],csvData[(i*2)+1][2]];
        }
        csvData = csvData.slice(0,csvData.length/2);
        csvData.forEach(function(row, index) { // substitute 'nan' with previous value
          row[0] = row[0].substr(0, 19);
          if (index === 0)
            return;
          if (row[1] === 'nan')
            csvData[index][1] = csvData[index-1][1];
          if (row[2] === 'nan')
            csvData[index][2] = csvData[index-1][2];          
        });
        csvData = csvData.filter(function(row) {
          return row[1] !== 'nan' && row[2] !== 'nan' && parseInt(row[1]) < 100 && parseInt(row[2]) < 100 && (!lastDate || Moment.moment.utc(row[0], 'YYYY-MM-DD HH:mm:ss').isAfter(lastDate));
        }); // remove erroneous and already existing entries
        if (csvData.length !== 0) {
          sheet.getRange(pos, 1, csvData.length, csvData[0].length).setValues(csvData);
          pos = pos + csvData.length;
        }
      }
    }
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).sort(1);
  });});
}
