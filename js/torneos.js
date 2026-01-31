// torneos.js - Versión simplificada y funcional

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
        return new Date(d.setDate(diff));
    }

    function formatDisplayDate(date) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
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
            console.log('🔍 Cargando eventos...');
            
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) throw error;
            
            console.log(`✅ ${data?.length || 0} eventos cargados`);
            events = data || [];
            
            if (events.length === 0) {
                showNoEventsMessage();
            } else {
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
        
        let html = '<div class="day-header empty"></div>';
        
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

    // === RENDERIZAR CUERPO DEL CALENDARIO ===
    function renderCalendarBody() {
        const body = document.getElementById('calendar-body');
        if (!body) return;
        
        // Limpiar
        body.innerHTML = '';
        
        // Si no hay eventos
        if (events.length === 0) {
            body.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados para esta semana.</p>
                </div>
            `;
            return;
        }
        
        // Calcular límites de la semana
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filtrar eventos visibles esta semana
        const visibleEvents = events.filter(event => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            return eventEnd >= weekStart && eventStart <= weekEnd;
        });
        
        // Si no hay eventos visibles
        if (visibleEvents.length === 0) {
            body.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados para esta semana.</p>
                </div>
            `;
            return;
        }
        
        // Organizar en filas (máximo 5 filas para evitar superposición excesiva)
        const rows = [[], [], [], [], []];
        
        visibleEvents.forEach(event => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            
            // Calcular días visibles en esta semana
            const visibleStart = eventStart < weekStart ? weekStart : eventStart;
            const visibleEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
            
            const startDay = Math.max(0, Math.floor((visibleStart - weekStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.floor((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Buscar primera fila disponible
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                let conflict = false;
                
                for (const existing of rows[rowIndex]) {
                    // Verificar si hay solapamiento
                    if (!(startDay + durationDays <= existing.startDay || startDay >= existing.startDay + existing.durationDays)) {
                        conflict = true;
                        break;
                    }
                }
                
                if (!conflict) {
                    rows[rowIndex].push({
                        event,
                        startDay,
                        durationDays
                    });
                    break;
                }
            }
        });
        
        // Renderizar filas
        let html = '';
        
        rows.forEach((rowEvents, rowIndex) => {
            if (rowEvents.length === 0) return;
            
            // Crear fila
            html += `<div class="calendar-row" id="row-${rowIndex}">`;
            
            // Columna de etiquetas (vacía si no es la primera fila)
            if (rowIndex === 0) {
                const firstEvent = rowEvents[0].event;
                html += `
                    <div class="row-label">
                        <div class="event-icon" style="background-color: ${firstEvent.color || '#5865f2'}20; color: ${firstEvent.color || '#5865f2'}">
                            <i class="fas ${firstEvent.icon || 'fa-gamepad'}"></i>
                        </div>
                        <div class="event-info">
                            <div class="event-title">${firstEvent.title}</div>
                            <div class="event-dates">${formatDisplayDate(new Date(firstEvent.start_date))} - ${formatDisplayDate(new Date(firstEvent.end_date))}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="row-label empty"></div>`;
            }
            
            // Crear contenedor de 7 días
            html += `<div class="days-container">`;
            
            // 7 columnas vacías (días)
            for (let day = 0; day < 7; day++) {
                html += `<div class="day-column" id="day-${rowIndex}-${day}"></div>`;
            }
            
            html += `</div></div>`;
        });
        
        body.innerHTML = html;
        
        // Ahora dibujar las barras
        renderEventBars(rows);
        renderLegend();
    }

    function organizeEventsIntoRows() {
        const rows = [];
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filtrar eventos visibles esta semana
        const visibleEvents = events.filter(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            return endDate >= weekStart && startDate <= weekEnd;
        });
        
        // Ordenar por fecha de inicio
        visibleEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        // Organizar en filas sin superposición
        visibleEvents.forEach(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            
            // Calcular días visibles en esta semana
            const visibleStart = startDate < weekStart ? weekStart : startDate;
            const visibleEnd = endDate > weekEnd ? weekEnd : endDate;
            
            const startDay = Math.max(0, Math.floor((visibleStart - weekStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.floor((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Buscar fila donde quepa
            let placed = false;
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const row = rows[rowIndex];
                let conflict = false;
                
                for (const existingEvent of row) {
                    if (!(startDay + durationDays - 1 < existingEvent.startDay || 
                          startDay > existingEvent.startDay + existingEvent.durationDays - 1)) {
                        conflict = true;
                        break;
                    }
                }
                
                if (!conflict) {
                    row.push({
                        eventId: event.id,
                        startDay,
                        durationDays,
                        color: event.color || '#5865f2',
                        title: event.title,
                        icon: event.icon || 'fa-gamepad'
                    });
                    placed = true;
                    break;
                }
            }
            
            // Si no cupo en ninguna fila existente, crear nueva
            if (!placed) {
                rows.push([{
                    eventId: event.id,
                    startDay,
                    durationDays,
                    color: event.color || '#5865f2',
                    title: event.title,
                    icon: event.icon || 'fa-gamepad'
                }]);
            }
        });
        
        return rows;
    }

    // === DIBUJAR BARRAS ===
    function renderEventBars(rows) {
        // Primero limpiar todas las barras existentes
        document.querySelectorAll('.event-bar').forEach(bar => bar.remove());
        
        // Para cada fila
        rows.forEach((rowEvents, rowIndex) => {
            const rowElement = document.getElementById(`row-${rowIndex}`);
            if (!rowElement) return;
            
            const daysContainer = rowElement.querySelector('.days-container');
            if (!daysContainer) return;
            
            // Para cada evento en esta fila
            rowEvents.forEach(eventData => {
                const { event, startDay, durationDays } = eventData;
                
                // Calcular posición
                const dayWidth = 100 / 7; // 14.2857% por día
                const left = startDay * dayWidth;
                const width = durationDays * dayWidth;
                
                // Crear barra
                const bar = document.createElement('div');
                bar.className = 'event-bar';
                bar.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: ${left}%;
                    width: ${width}%;
                    height: 30px;
                    background-color: ${event.color || '#5865f2'};
                    transform: translateY(-50%);
                    border-radius: 6px;
                    padding: 0 10px;
                    display: flex;
                    align-items: center;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 500;
                    z-index: 2;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    overflow: hidden;
                    white-space: nowrap;
                    box-sizing: border-box;
                `;
                
                // Tooltip
                const startTime = event.start_time ? formatTime(event.start_time) : '';
                const endTime = event.end_time ? formatTime(event.end_time) : '';
                bar.title = `${event.title}\n${formatDisplayDate(new Date(event.start_date))}${startTime ? ' ' + startTime : ''} - ${formatDisplayDate(new Date(event.end_date))}${endTime ? ' ' + endTime : ''}`;
                
                // Contenido
                bar.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px; width: 100%;">
                        <i class="fas ${event.icon || 'fa-gamepad'}" style="font-size: 0.9rem;"></i>
                        ${durationDays >= 2 ? `<span style="overflow: hidden; text-overflow: ellipsis;">${event.title}</span>` : ''}
                    </div>
                `;
                
                // Efectos hover
                bar.addEventListener('mouseenter', function() {
                    this.style.zIndex = '100';
                    this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    this.style.transform = 'translateY(-50%) scale(1.02)';
                });
                
                bar.addEventListener('mouseleave', function() {
                    this.style.zIndex = '2';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    this.style.transform = 'translateY(-50%)';
                });
                
                // Añadir al contenedor de días
                daysContainer.appendChild(bar);
            });
        });
    }

    function renderLegend() {
        const legendItems = document.getElementById('legend-items');
        if (!legendItems) return;
        
        const uniqueEvents = [...new Map(events.map(e => [e.title, {
            color: e.color || '#5865f2',
            title: e.title,
            icon: e.icon || 'fa-gamepad'
        }])).values()];
        
        let html = '';
        if (uniqueEvents.length > 0) {
            uniqueEvents.forEach(event => {
                html += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${event.color}">
                            <i class="fas ${event.icon}"></i>
                        </div>
                        <div class="legend-text">${event.title}</div>
                    </div>
                `;
            });
            legendItems.innerHTML = html;
        }
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
