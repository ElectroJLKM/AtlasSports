// torneos.js - Versión corregida con visualización mejorada

document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar Supabase
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        console.error('❌ Error: Supabase no inicializado');
        showError('Error de configuración. Recarga la página.');
        return;
    }
    
    // Variables globales
    let currentWeekStart = new Date();
    let events = [];

    // === FUNCIONES UTILITARIAS ===
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    function formatDisplayDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5); // Formato HH:mm
    }

    function getWeekRange(startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const startMonth = startDate.toLocaleDateString('es-ES', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('es-ES', { month: 'short' });
        
        if (startMonth === endMonth) {
            return `${startDate.getDate()} - ${endDate.getDate()} de ${startMonth} ${startDate.getFullYear()}`;
        } else {
            return `${startDate.getDate()} de ${startMonth} - ${endDate.getDate()} de ${endMonth} ${startDate.getFullYear()}`;
        }
    }

    function getDayName(date) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    }

    function showError(message) {
        const calendarBody = document.getElementById('calendar-body');
        if (calendarBody) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                </div>
            `;
        }
        
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // === CARGAR EVENTOS ===
    async function loadEvents() {
        try {
            console.log('🔍 Cargando eventos desde Supabase...');
            
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) {
                console.error('Error de Supabase:', error);
                
                if (error.code === 'PGRST116') {
                    showError('La tabla de eventos no existe. Contacta al administrador.');
                    return;
                }
                throw error;
            }
            
            console.log(`✅ ${data?.length || 0} eventos cargados`);
            events = data || [];
            
            if (events.length === 0) {
                showNoEventsMessage();
            } else {
                console.log('📅 Eventos cargados exitosamente');
                renderCalendar();
            }
            
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            showError('Error cargando los eventos: ' + error.message);
        } finally {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }

    function showNoEventsMessage() {
        const calendarBody = document.getElementById('calendar-body');
        if (calendarBody) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados.</p>
                    <p class="small-text">Agrega eventos desde el panel de administración.</p>
                </div>
            `;
        }
    }

    // === RENDERIZAR CALENDARIO ===
    function renderCalendarHeader() {
        const header = document.getElementById('calendar-header');
        if (!header) return;
        
        let html = '<div class="day-header empty">Evento</div>';
        
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            
            const isToday = date.toDateString() === today.toDateString();
            const dayName = getDayName(date);
            const shortDayName = dayName.substring(0, 3);
            
            html += `
                <div class="day-header ${isToday ? 'today' : ''}">
                    <span class="date">${date.getDate()}</span>
                    <span class="day">${shortDayName}</span>
                </div>
            `;
        }
        
        header.innerHTML = html;
        
        const weekRangeElement = document.getElementById('week-range');
        if (weekRangeElement) {
            weekRangeElement.textContent = getWeekRange(currentWeekStart);
        }
    }

    function renderCalendarBody() {
        const body = document.getElementById('calendar-body');
        if (!body) return;
        
        // Limpiar el cuerpo
        body.innerHTML = '';
        
        // Calcular límites de la semana
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filtrar eventos que intersectan con esta semana
        const weekEvents = events.filter(event => {
            try {
                const eventStart = new Date(event.start_date + 'T00:00:00');
                const eventEnd = new Date(event.end_date + 'T23:59:59');
                
                return eventStart <= weekEnd && eventEnd >= weekStart;
            } catch (e) {
                console.warn('Error procesando evento:', event, e);
                return false;
            }
        });
        
        if (weekEvents.length === 0) {
            body.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados para esta semana.</p>
                </div>
            `;
            renderLegend();
            return;
        }
        
        // Agrupar eventos por fila para evitar solapamientos
        const eventRows = [];
        
        weekEvents.forEach(event => {
            // Calcular posición en la semana
            const eventStart = new Date(event.start_date + 'T00:00:00');
            const eventEnd = new Date(event.end_date + 'T23:59:59');
            
            // Ajustar al rango visible de la semana
            const visibleStart = eventStart < weekStart ? weekStart : eventStart;
            const visibleEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
            
            // Calcular días desde el lunes (0-6)
            const startDay = Math.floor((visibleStart - weekStart) / (1000 * 60 * 60 * 24));
            const durationDays = Math.ceil((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Limitar al rango de 0-6 días
            const finalStartDay = Math.max(0, Math.min(startDay, 6));
            const finalDurationDays = Math.min(durationDays, 7 - finalStartDay);
            
            if (finalDurationDays <= 0) return;
            
            // Buscar una fila donde colocar el evento sin conflictos
            let rowIndex = 0;
            let placed = false;
            
            while (!placed) {
                if (!eventRows[rowIndex]) {
                    eventRows[rowIndex] = [];
                }
                
                // Verificar conflictos en esta fila
                const conflict = eventRows[rowIndex].some(existingEvent => {
                    return !(finalStartDay + finalDurationDays <= existingEvent.startDay || 
                           finalStartDay >= existingEvent.startDay + existingEvent.durationDays);
                });
                
                if (!conflict) {
                    eventRows[rowIndex].push({
                        event,
                        startDay: finalStartDay,
                        durationDays: finalDurationDays
                    });
                    placed = true;
                } else {
                    rowIndex++;
                }
            }
        });
        
        // Renderizar las filas
        eventRows.forEach((rowEvents, rowIndex) => {
            const rowHtml = createEventRow(rowEvents, rowIndex);
            body.innerHTML += rowHtml;
        });
        
        renderLegend();
    }

    function createEventRow(rowEvents, rowIndex) {
        const event = rowEvents[0].event;
        
        let html = `
            <div class="event-row">
                <div class="event-label">
                    <div class="event-icon" style="background-color: ${event.color || '#5865f2'}20; color: ${event.color || '#5865f2'}">
                        <i class="fas ${event.icon || 'fa-gamepad'}"></i>
                    </div>
                    <div class="event-info">
                        <div class="event-title">${event.title}</div>
                        <div class="event-dates">${formatDisplayDate(new Date(event.start_date))} - ${formatDisplayDate(new Date(event.end_date))}</div>
                    </div>
                </div>
                <div class="calendar-cells">
        `;
        
        // Crear celdas vacías
        for (let day = 0; day < 7; day++) {
            html += `<div class="day-cell" id="cell-${rowIndex}-${day}"></div>`;
        }
        
        html += `</div></div>`;
        
        // Añadir las barras de eventos después de que el DOM esté listo
        setTimeout(() => {
            rowEvents.forEach(eventData => {
                createEventBar(eventData, rowIndex);
            });
        }, 10);
        
        return html;
    }

    function createEventBar(eventData, rowIndex) {
        const { event, startDay, durationDays } = eventData;
        const firstCell = document.getElementById(`cell-${rowIndex}-${startDay}`);
        
        if (!firstCell) return;
        
        // Calcular dimensiones
        const cellWidth = 100 / 7; // Porcentaje por día
        const left = startDay * cellWidth;
        const width = durationDays * cellWidth;
        
        // Crear contenedor para la barra
        const barContainer = document.createElement('div');
        barContainer.className = 'event-bar-container';
        barContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: ${left}%;
            width: ${width}%;
            height: 100%;
            pointer-events: none;
        `;
        
        // Crear la barra
        const bar = document.createElement('div');
        bar.className = `event-bar ${rowIndex % 2 === 0 ? '' : 'overlap-2'}`;
        bar.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            width: calc(100% - 4px);
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${event.color || '#5865f2'}, ${adjustColor(event.color || '#5865f2', -30)});
            color: white;
            z-index: ${rowIndex + 2};
        `;
        
        // Tooltip
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        const tooltip = `
${event.title}
📅 ${formatDisplayDate(startDate)}
${event.start_time ? '🕒 ' + formatTime(event.start_time) : ''}
➡ ${formatDisplayDate(endDate)}
${event.end_time ? '🕒 ' + formatTime(event.end_time) : ''}
${event.description ? '📝 ' + event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : ''}
        `.trim();
        
        bar.title = tooltip;
        
        // Contenido de la barra
        const showTitle = durationDays >= 2;
        bar.innerHTML = `
            <div class="event-bar-content">
                <i class="fas ${event.icon || 'fa-gamepad'}"></i>
                ${showTitle ? `<span class="event-bar-title">${event.title}</span>` : ''}
            </div>
        `;
        
        // Eventos hover
        bar.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-50%) scale(1.02)';
            this.style.zIndex = '20';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
        });
        
        bar.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-50%)';
            this.style.zIndex = rowIndex + 2;
            this.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        });
        
        // Añadir al DOM
        barContainer.appendChild(bar);
        firstCell.appendChild(barContainer);
    }

    function adjustColor(color, amount) {
        // Función auxiliar para ajustar colores
        return color; // Simplificado - puedes implementar lógica más compleja
    }

    function renderLegend() {
        const legendItems = document.getElementById('legend-items');
        if (!legendItems || !events.length) return;
        
        // Obtener eventos únicos por título
        const uniqueEvents = [...new Map(events.map(e => [e.title, e])).values()];
        
        let html = '';
        uniqueEvents.forEach(event => {
            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${event.color || '#5865f2'}">
                        <i class="fas ${event.icon || 'fa-gamepad'}"></i>
                    </div>
                    <div class="legend-text">${event.title}</div>
                </div>
            `;
        });
        
        legendItems.innerHTML = html;
    }

    function renderCalendar() {
        renderCalendarHeader();
        renderCalendarBody();
    }

    function changeWeek(direction) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
        renderCalendar();
    }

    // === INICIALIZACIÓN ===
    currentWeekStart = getMonday(new Date());
    
    // Configurar botones
    document.getElementById('prev-week')?.addEventListener('click', () => changeWeek(-1));
    document.getElementById('next-week')?.addEventListener('click', () => changeWeek(1));
    
    // Botón "Hoy"
    const todayBtn = document.createElement('button');
    todayBtn.className = 'calendar-btn';
    todayBtn.innerHTML = '<i class="fas fa-calendar-day"></i> Hoy';
    todayBtn.addEventListener('click', () => {
        currentWeekStart = getMonday(new Date());
        renderCalendar();
    });
    
    const controls = document.querySelector('.calendar-controls');
    if (controls) {
        controls.appendChild(todayBtn);
    }
    
    // Cargar eventos
    loadEvents();
});
