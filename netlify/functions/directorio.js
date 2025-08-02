const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

exports.handler = async function (event, context) {
  try {
    // Ruta al archivo Excel dentro de la carpeta "files"
    const filePath = path.join(__dirname, 'files', 'directorio.xlsx');

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
