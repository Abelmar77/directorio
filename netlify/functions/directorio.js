// Ubicado en: directorio/netlify/functions/directorio.js

const xlsx = require('xlsx');
const path = require('path');

exports.handler = async function (event, context) {
    try {
        // Netlify coloca los archivos incluidos junto al script de la función.
        // Esta es la forma más simple y correcta de encontrarlo.
        const filePath = path.join(__dirname, 'directorio.xlsx');

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
