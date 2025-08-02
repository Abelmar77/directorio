// Referencias a los elementos del DOM
const searchNombreInput = document.getElementById('searchNombre');
const searchFederalInput = document.getElementById('searchFederal');
const tableBody = document.getElementById('directorio-tbody');

let directorioData = []; // Aquí guardaremos todos los datos del directorio

// Función para quitar acentos
const quitarAcentos = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Función para renderizar la tabla
const renderTable = (data) => {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron resultados.</td></tr>';
        return;
    }

    data.forEach(empleado => {
        const row = `
            <tr>
                <td>${empleado.nombre}</td>
                <td>${empleado.puesto}</td>
                <td>${empleado.telefono}</td>
                <td>${empleado.celular || ''}</td>
                <td>${empleado.federal} - ${empleado.sede}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
};

// Función para filtrar datos
const filtrarDatos = () => {
    const filtroNombre = searchNombreInput.value.trim();
    const filtroFederal = searchFederalInput.value.trim();

    if (filtroNombre === '' && filtroFederal === '') {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ingrese un término de búsqueda para ver resultados.</td></tr>';
        return;
    }

    const filtroNombreNorm = quitarAcentos(filtroNombre.toLowerCase());
    const filtroFederalNorm = quitarAcentos(filtroFederal.toLowerCase());

    const datosFiltrados = directorioData.filter(empleado => {
        const nombreCompleto = quitarAcentos(String(empleado.nombre || '').toLowerCase());
        const federal = quitarAcentos(String(empleado.federal || '').toLowerCase());

        return nombreCompleto.includes(filtroNombreNorm) && federal.includes(filtroFederalNorm);
    });

    renderTable(datosFiltrados);
};

// Evento DOMContentLoaded corregido
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/.netlify/functions/directorio');
        const json = await response.json();

        if (!Array.isArray(json)) {
            console.error("Respuesta inesperada del servidor:", json);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error del servidor: ${json.error || "Respuesta no válida"}</td></tr>`;
            return;
        }

        directorioData = json;
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ingrese un término de búsqueda para ver resultados.</td></tr>';
    } catch (error) {
        console.error("Error al cargar los datos del directorio:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">${error.message}</td></tr>`;
    }

    searchNombreInput.addEventListener('keyup', filtrarDatos);
    searchFederalInput.addEventListener('keyup', filtrarDatos);
});

