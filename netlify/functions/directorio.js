const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

exports.handler = async function (event, context) {
  try {
    // Ruta al archivo Excel
    const filePath = path.join(__dirname, 'directorio.xlsx');

    // Lee el archivo Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convierte a JSON
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    // Devuelve los datos como JSON
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
