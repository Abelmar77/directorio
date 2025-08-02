// Ubicado en: directorio/netlify/functions/directorio.js

const xlsx = require('xlsx');
const path = require('path');

exports.handler = async function (event, context) {
    try {
        // CORRECCIÓN: Añadimos 'files' a la ruta.
        const filePath = path.join(__dirname, 'files/directorio.xlsx');

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `No se pudo leer el archivo: ${error.message}` }),
        };
    }
};
