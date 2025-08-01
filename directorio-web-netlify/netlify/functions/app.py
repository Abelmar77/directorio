import pandas as pd
import json
import os

def handler(event, context):
    """
    Esta es la función que Netlify ejecutará cuando se llame a la API.
    """
    try:
        # Construye la ruta al archivo Excel, que está en el mismo directorio
        # que este script de Python.
        script_dir = os.path.dirname(__file__)
        file_path = os.path.join(script_dir, 'directorio.xlsx')

        # Lee el archivo de Excel.
        df = pd.read_excel(file_path)

        # Limpia los datos como antes.
        df.columns = df.columns.str.strip().str.lower()
        df = df.fillna('')

        # Convierte el DataFrame a una lista de diccionarios.
        data = df.to_dict(orient='records')

        # La función debe devolver un diccionario con un statusCode y un body
        # que debe ser un string JSON.
        return {
            'statusCode': 200,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps(data)
        }

    except Exception as e:
        # Manejo de errores
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }