const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Carga las credenciales desde las variables de entorno de Netlify
const creds = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};
const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// El ID de tu hoja de cálculo
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

exports.handler = async (event, context) => {
  try {
    await doc.loadInfo(); // Carga la información de la hoja
    const sheet = doc.sheetsByIndex[0]; // Obtiene la primera hoja
    const rows = await sheet.getRows(); // Obtiene todas las filas

    // Mapea las filas al formato JSON que tu front-end espera
    const data = rows.map(row => {
      const rowData = {};
      // sheet.headerValues contiene los nombres de tus columnas
      sheet.headerValues.forEach(header => {
        rowData[header] = row.get(header);
      });
      return rowData;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No se pudieron cargar los datos.' }),
    };
  }
};
