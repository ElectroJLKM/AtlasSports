// torneos.js - Versión corregida con barras horizontales

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

    // === RENDERIZAR ENCABEZADO ===
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

    // === ORGANIZAR EVENTOS EN FILAS ===
    function organizeEvents() {
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Filtrar eventos visibles
        const visibleEvents = events.filter(event => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            return eventEnd >= weekStart && eventStart <= weekEnd;
        });
        
        // Ordenar por fecha de inicio
        visibleEvents.sort((a, b) => {
            const aStart = new Date(a.start_date);
            const bStart = new Date(b.start_date);
            return aStart - bStart;
        });
        
        // Crear hasta 5 filas
        const rows = [[], [], [], [], []];
        
        visibleEvents.forEach(event => {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            
            // Calcular posición en la semana
            const visibleStart = eventStart < weekStart ? weekStart : eventStart;
            const visibleEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
            
            const startDay = Math.max(0, Math.floor((visibleStart - weekStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.floor((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Buscar fila disponible
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                let hasConflict = false;
                
                for (const existing of rows[rowIndex]) {
                    // Verificar solapamiento
                    const existingEnd = existing.startDay + existing.durationDays - 1;
                    const newEnd = startDay + durationDays - 1;
                    
                    if (!(newEnd < existing.startDay || startDay > existingEnd)) {
                        hasConflict = true;
                        break;
                    }
                }
                
                if (!hasConflict) {
                    rows[rowIndex].push({
                        event,
                        startDay,
                        durationDays
                    });
                    break;
                }
            }
        });
        
        return rows;
    }

    // === RENDERIZAR CUERPO DEL CALENDARIO ===
    function renderCalendarBody() {
        const body = document.getElementById('calendar-body');
        if (!body) return;
        
        body.innerHTML = '';
        
        const rows = organizeEvents();
        
        // Verificar si hay eventos visibles
        const hasEvents = rows.some(row => row.length > 0);
        
        if (!hasEvents) {
            body.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados para esta semana.</p>
                </div>
            `;
            return;
        }
        
        // Crear filas del calendario
        let html = '';
        
        rows.forEach((rowEvents, rowIndex) => {
            if (rowEvents.length === 0) return;
            
            // Crear fila
            html += `<div class="calendar-row" id="row-${rowIndex}">`;
            
            // Columna de etiqueta
            const firstEvent = rowEvents[0].event;
            const isFirstRow = rowIndex === 0;
            
            if (isFirstRow) {
                html += `
                    <div class="row-label">
                        <div class="event-icon" style="background-color: ${firstEvent.color || '#5865f2'}20; color: ${firstEvent.color || '#5865f2'}">
                            <i class="fas ${firstEvent.icon || 'fa-gamepad'}"></i>
                        </div>
                        <div class="event-info">
                            <div class="event-title">${firstEvent.title}</div>
                            <div class="event-dates">${formatDisplayDate(new Date(firstEvent.start_date))} - ${formatDisplayDate(new Date(firstEvent.end_date))}</div>
                            ${firstEvent.start_time ? `<div class="event-time">${formatTime(firstEvent.start_time)} - ${formatTime(firstEvent.end_time)}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="row-label empty"></div>`;
            }
            
            // Contenedor de 7 días
            html += `<div class="days-container" id="days-${rowIndex}">`;
            
            // 7 columnas de días (vacías)
            for (let day = 0; day < 7; day++) {
                html += `<div class="day-column" id="day-${rowIndex}-${day}"></div>`;
            }
            
            html += `</div></div>`;
        });
        
        body.innerHTML = html;
        
        // Dibujar barras
        drawEventBars(rows);
        renderLegend();
    }

    // === DIBUJAR BARRAS DE EVENTOS ===
    function drawEventBars(rows) {
        // Limpiar barras existentes
        document.querySelectorAll('.event-bar').forEach(bar => bar.remove());
        
        rows.forEach((rowEvents, rowIndex) => {
            const daysContainer = document.getElementById(`days-${rowIndex}`);
            if (!daysContainer) return;
            
            rowEvents.forEach(eventData => {
                const { event, startDay, durationDays } = eventData;
                
                // Calcular posición y tamaño
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
                    background: linear-gradient(135deg, ${event.color || '#5865f2'}, ${event.color || '#5865f2'}dd);
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
                    border: 1px solid rgba(255,255,255,0.3);
                    transition: all 0.2s ease;
                `;
                
                // Tooltip
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const startTime = event.start_time ? formatTime(event.start_time) : '';
                const endTime = event.end_time ? formatTime(event.end_time) : '';
                
                bar.title = `${event.title}\n${formatDisplayDate(startDate)}${startTime ? ' ' + startTime : ''} - ${formatDisplayDate(endDate)}${endTime ? ' ' + endTime : ''}${event.description ? '\n' + event.description : ''}`;
                
                // Contenido de la barra
                const showTitle = durationDays >= 2;
                bar.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px; width: 100%;">
                        <i class="fas ${event.icon || 'fa-gamepad'}" style="font-size: 0.9rem;"></i>
                        ${showTitle ? `<span style="overflow: hidden; text-overflow: ellipsis;">${event.title}</span>` : ''}
                    </div>
                `;
                
                // Efectos hover
                bar.addEventListener('mouseenter', function() {
                    this.style.zIndex = '100';
                    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    this.style.transform = 'translateY(-50%) scale(1.03)';
                });
                
                bar.addEventListener('mouseleave', function() {
                    this.style.zIndex = '2';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    this.style.transform = 'translateY(-50%)';
                });
                
                // Añadir al contenedor
                daysContainer.appendChild(bar);
            });
        });
    }

    // === RENDERIZAR LEYENDA ===
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

    // === RENDERIZAR CALENDARIO COMPLETO ===
    function renderCalendar() {
        renderCalendarHeader();
        renderCalendarBody();
    }

    // === CAMBIAR SEMANA ===
    function changeWeek(direction) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
        renderCalendar();
    }

    // === INICIALIZACIÓN ===
    currentWeekStart = getMonday(new Date());
    
    // Configurar botones
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => changeWeek(1));
    }
    
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
