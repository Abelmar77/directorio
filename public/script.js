document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a los elementos del DOM ---
    const searchNombreInput = document.getElementById('searchNombre');
    const searchFederalInput = document.getElementById('searchFederal');
    const filterPuestoSelect = document.getElementById('filterPuesto');
    const tableBody = document.getElementById('directorio-tbody');
    const tableHeaders = document.querySelectorAll('th.sortable');
    const loadingSpinner = document.getElementById('loading-spinner');

    let directorioData = [];
    let pinnedEmployees = []; // NUEVO: Array para guardar los empleados fijados
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
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No se encontraron resultados.</td></tr>`;
            return;
        }

        const isPinned = (employee) => pinnedEmployees.some(p => p.nombre === employee.nombre);

        data.forEach(empleado => {
            const row = document.createElement('tr');
            if (isPinned(empleado)) {
                row.classList.add('pinned-row');
            }
            
            // Lógica para resaltar el texto buscado
            const highlight = (text, filter) => {
                if (!filter || !text) return text;
                const regex = new RegExp(`(${filter})`, 'gi');
                return String(text).replace(regex, `<mark>$1</mark>`);
            };

            const createCell = (content, className = '') => {
                const cell = document.createElement('td');
                if (className) cell.className = className;
                cell.innerHTML = content;
                return cell;
            };

            const createCopyCell = (text) => {
                 const content = text ? `${text} <i class="copy-icon" title="Copiar">📋</i>` : '';
                 return createCell(content);
            };

            // Crear celda para el checkbox de fijar
            const pinCell = createCell('', 'pin-cell');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'pin-checkbox';
            checkbox.dataset.employeeName = empleado.nombre;
            checkbox.checked = isPinned(empleado);
            pinCell.appendChild(checkbox);
            
            row.appendChild(pinCell);
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
        
        const noFilters = !filtroNombre && !filtroFederal && !filtroPuesto;

        // Si no hay filtros, mostrar solo los fijados. Si no hay fijados, mostrar mensaje.
        if (noFilters) {
            if (pinnedEmployees.length > 0) {
                renderTable(pinnedEmployees.sort(sortFunction), {});
            } else {
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Ingrese un término de búsqueda o filtro.</td></tr>`;
            }
            return;
        }

        const filtroNombreNorm = quitarAcentos(filtroNombre.toLowerCase());
        const filtroFederalNorm = quitarAcentos(filtroFederal.toLowerCase());

        let datosFiltrados = directorioData.filter(empleado => {
            const nombreCompleto = quitarAcentos(String(empleado.nombre || '').toLowerCase());
            const federal = quitarAcentos(String(empleado.federal || '').toLowerCase());
            const puesto = empleado.puesto || '';

            return nombreCompleto.includes(filtroNombreNorm) &&
                   federal.includes(filtroFederalNorm) &&
                   (filtroPuesto === '' || puesto === filtroPuesto);
        });

        // Combinar resultados filtrados y fijados, sin duplicados
        const combinedResults = [...pinnedEmployees, ...datosFiltrados];
        const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.nombre, item])).values());
        
        // Ordenar los datos
        const sortFunction = (a, b) => {
            const valA = String(a[sortState.column] || '').toLowerCase();
            const valB = String(b[sortState.column] || '').toLowerCase();
            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        };
        uniqueResults.sort(sortFunction);

        renderTable(uniqueResults, { nombre: filtroNombreNorm, federal: filtroFederalNorm });
    };
    
    const debouncedProcessData = debounce(processData, 300);

    // --- Inicialización ---
    // (Esta sección no cambia mucho, solo el colspan)
    loadingSpinner.style.display = 'flex';
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Cargando directorio...</td></tr>`;
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
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Ingrese un término de búsqueda para ver resultados.</td></tr>`;
    } catch (error) {
        console.error("Error al cargar los datos:", error);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">${error.message}</td></tr>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }

    // --- Event Listeners ---
    searchNombreInput.addEventListener('keyup', debouncedProcessData);
    searchFederalInput.addEventListener('keyup', debouncedProcessData);
    filterPuestoSelect.addEventListener('change', debouncedProcessData);

    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Lógica de ordenamiento (sin cambios)
            const column = header.dataset.sort;
            if (sortState.column === column) {
                sortState.direction = sort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = column;
                sortState.direction = 'asc';
            }
            tableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(sortState.direction);
            processData();
        });
    });

    // NUEVO: Event listener para los checkboxes y los íconos de copiar
    tableBody.addEventListener('click', (event) => {
        // Lógica para fijar/desfijar
        if (event.target.classList.contains('pin-checkbox')) {
            const name = event.target.dataset.employeeName;
            const employee = directorioData.find(e => e.nombre === name);
            if (!employee) return;

            if (event.target.checked) {
                if (!pinnedEmployees.some(p => p.nombre === name)) {
                    pinnedEmployees.push(employee);
                }
            } else {
                pinnedEmployees = pinnedEmployees.filter(p => p.nombre !== name);
            }
            processData();
        }

        // Lógica para copiar
        if (event.target.classList.contains('copy-icon')) {
            const textToCopy = event.target.parentElement.textContent.replace('📋', '').replace('✅', '').trim();
            navigator.clipboard.writeText(textToCopy);
            event.target.textContent = '✅';
            setTimeout(() => { event.target.textContent = '📋'; }, 1000);
        }
    });
});
