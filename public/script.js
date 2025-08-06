document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a los elementos del DOM ---
    const searchNombreInput = document.getElementById('searchNombre');
    const searchFederalInput = document.getElementById('searchFederal');
    const filterPuestoSelect = document.getElementById('filterPuesto');
    const tableBody = document.getElementById('directorio-tbody');
    const tableHeaders = document.querySelectorAll('th.sortable');
    const loadingSpinner = document.getElementById('loading-spinner');

    let directorioData = [];
    let sortState = { column: 'nombre', direction: 'asc' };

    // --- Funciones de Utilidad ---
    const quitarAcentos = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };
    
    // --- Lógica Principal ---
    const renderTable = (data, filters) => {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No se encontraron resultados.</td></tr>`;
            return;
        }

        data.forEach(empleado => {
            const row = document.createElement('tr');
            
            const highlight = (text, filter) => {
                if (!filter) return text;
                const regex = new RegExp(`(${filter})`, 'gi');
                return text.replace(regex, `<mark>$1</mark>`);
            };

            const createCell = (content) => {
                const cell = document.createElement('td');
                cell.innerHTML = content;
                return cell;
            };

            const createCopyCell = (text) => {
                const cell = createCell(text);
                if (text) {
                    const icon = document.createElement('i');
                    icon.className = 'copy-icon';
                    icon.textContent = '📋';
                    icon.title = 'Copiar';
                    icon.onclick = () => {
                        navigator.clipboard.writeText(text);
                        icon.textContent = '✅';
                        setTimeout(() => { icon.textContent = '📋'; }, 1000);
                    };
                    cell.appendChild(icon);
                }
                return cell;
            };
            
            row.appendChild(createCell(highlight(empleado.nombre, filters.nombre)));
            row.appendChild(createCell(empleado.puesto));
            row.appendChild(createCopyCell(empleado.telefono));
            row.appendChild(createCopyCell(empleado.celular || ''));
            row.appendChild(createCell(highlight(`${empleado.federal} - ${empleado.sede}`, filters.federal)));
            row.appendChild(createCell(empleado.horario || ''));
            row.appendChild(createCell(empleado.comida || ''));

            tableBody.appendChild(row);
        });
    };

    const processData = () => {
        const filtroNombre = searchNombreInput.value.trim();
        const filtroFederal = searchFederalInput.value.trim();
        const filtroPuesto = filterPuestoSelect.value;

        if (!filtroNombre && !filtroFederal && !filtroPuesto) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Ingrese un término de búsqueda o filtro.</td></tr>`;
            return;
        }

        const filtroNombreNorm = quitarAcentos(filtroNombre.toLowerCase());
        const filtroFederalNorm = quitarAcentos(filtroFederal.toLowerCase());

        const datosFiltrados = directorioData.filter(empleado => {
            const nombreCompleto = quitarAcentos(String(empleado.nombre || '').toLowerCase());
            const federal = quitarAcentos(String(empleado.federal || '').toLowerCase());
            const puesto = empleado.puesto || '';

            return nombreCompleto.includes(filtroNombreNorm) &&
                   federal.includes(filtroFederalNorm) &&
                   (filtroPuesto === '' || puesto === filtroPuesto);
        });
        
        // Ordenar los datos
        datosFiltrados.sort((a, b) => {
            const valA = String(a[sortState.column] || '').toLowerCase();
            const valB = String(b[sortState.column] || '').toLowerCase();
            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        });

        renderTable(datosFiltrados, { nombre: filtroNombreNorm, federal: filtroFederalNorm });
    };
    
    const debouncedProcessData = debounce(processData, 300);

    // --- Inicialización ---
    loadingSpinner.style.display = 'flex';
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Cargando directorio...</td></tr>`;

    try {
        const response = await fetch('/.netlify/functions/directorio');
        directorioData = await response.json();
        
        const puestos = [...new Set(directorioData.map(e => e.puesto).filter(Boolean))].sort();
        puestos.forEach(puesto => {
            const option = document.createElement('option');
            option.value = puesto;
            option.textContent = puesto;
            filterPuestoSelect.appendChild(option);
        });

        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Ingrese un término de búsqueda para ver resultados.</td></tr>`;
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${error.message}</td></tr>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }

    // --- Event Listeners ---
    searchNombreInput.addEventListener('keyup', debouncedProcessData);
    searchFederalInput.addEventListener('keyup', debouncedProcessData);
    filterPuestoSelect.addEventListener('change', debouncedProcessData);

    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (sortState.column === column) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = column;
                sortState.direction = 'asc';
            }
            // Actualizar indicadores visuales
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(sortState.direction);
            
            processData(); // Ordenar y renderizar de nuevo
        });
    });
});
