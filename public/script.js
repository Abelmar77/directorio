/* static/script.js */

// Referencias a los elementos del DOM
const searchNombreInput = document.getElementById('searchNombre');
const searchFederalInput = document.getElementById('searchFederal');
const tableBody = document.getElementById('directorio-tbody');

let directorioData = []; // Aquí guardaremos todos los datos del directorio

// Función para quitar acentos
const quitarAcentos = (texto) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Función para renderizar (dibujar) la tabla con los datos
const renderTable = (data) => {
    tableBody.innerHTML = ''; // Limpiar la tabla actual
    
    // Si después de filtrar no hay datos, muestra este mensaje.
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

// --- FUNCIÓN MODIFICADA ---
const filtrarDatos = () => {
    // Obtenemos los valores y quitamos espacios en blanco de los costados
    const filtroNombre = searchNombreInput.value.trim();
    const filtroFederal = searchFederalInput.value.trim();

    // Si ambos campos de búsqueda están vacíos, limpia la tabla y muestra un mensaje.
    if (filtroNombre === '' && filtroFederal === '') {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ingrese un término de búsqueda para ver resultados.</td></tr>';
        return; // Detiene la función aquí
    }
    
    // Normalizamos los filtros para la búsqueda (minúsculas y sin acentos)
    const filtroNombreNorm = quitarAcentos(filtroNombre.toLowerCase());
    const filtroFederalNorm = quitarAcentos(filtroFederal.toLowerCase());

    const datosFiltrados = directorioData.filter(empleado => {
        // Aseguramos que los datos se traten como texto y los normalizamos
        const nombreCompleto = quitarAcentos(String(empleado.nombre || '').toLowerCase());
        const federal = quitarAcentos(String(empleado.federal || '').toLowerCase());

        const coincideNombre = nombreCompleto.includes(filtroNombreNorm);
        const coincideFederal = federal.includes(filtroFederalNorm);
        
        return coincideNombre && coincideFederal;
    });

    renderTable(datosFiltrados);
};


// --- EVENTO DE CARGA MODIFICADO ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/.netlify/functions/directorio');
        directorioData = await response.json();

        document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/.netlify/functions/directorio');
        const json = await response.json();

        // Verifica si json es un array
        if (!Array.isArray(json)) {
            console.error("Respuesta inesperada del servidor:", json);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error del servidor: ${json.error || "respuesta no válida"}</td></tr>`;
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

