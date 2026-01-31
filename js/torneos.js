[file name]: torneos.js
[file content begin]
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');
    const weekRangeElement = document.getElementById('week-range');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const todayBtn = document.getElementById('today-btn');
    const legendItemsElement = document.getElementById('legend-items');
    const loadingElement = document.getElementById('loading');
    const inscripcionesGrid = document.getElementById('inscripciones-grid');
    
    // Estado del calendario
    let currentDate = new Date();
    let events = [];
    
    // Inicialización
    initCalendar();
    
    // Event Listeners
    prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    nextWeekBtn.addEventListener('click', () => changeWeek(1));
    todayBtn.addEventListener('click', goToToday);
    
    // Función de inicialización
    async function initCalendar() {
        // Mostrar botón "Hoy"
        todayBtn.style.display = 'flex';
        
        // Inicializar Supabase
        const supabase = window.getSupabaseClient();
        if (!supabase) {
            console.error('Supabase no está inicializado');
            showError('Error de conexión con la base de datos');
            return;
        }
        
        // Cargar eventos reales desde Supabase
        await loadEventsFromSupabase(supabase);
        renderCalendar();
        renderLegend();
    }
    
    // Función para cargar eventos desde Supabase
    async function loadEventsFromSupabase(supabase) {
        try {
            loadingElement.style.display = 'flex';
            
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) throw error;
            
            // Transformar datos de Supabase al formato esperado
            events = data.map(event => ({
                id: event.id,
                name: event.title,
                game: 'Duck Game', // Puedes modificar esto si tienes una columna específica
                type: getEventTypeByColor(event.color),
                startDate: event.start_date,
                endDate: event.end_date,
                startTime: event.start_time || 'Por definir',
                endTime: event.end_time || 'Por definir',
                description: event.description || 'Sin descripción disponible',
                icon: event.icon || 'fa-gamepad',
                color: event.color || '#5865f2',
                created_at: event.created_at
            }));
            
            console.log(`✅ ${events.length} eventos cargados desde Supabase`);
            
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            showError('Error al cargar los eventos. Intenta recargar la página.');
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    // Función auxiliar para determinar tipo de evento por color
    function getEventTypeByColor(color) {
        const colorMap = {
            '#5865f2': 1, // Azul - Torneo
            '#10b981': 2, // Verde - Liga
            '#f59e0b': 3, // Naranja - Evento Especial
            '#ef4444': 4, // Rojo - Eliminatorio
            '#8b5cf6': 5  // Púrpura - Clasificatorio
        };
        
        return colorMap[color.toLowerCase()] || 1;
    }
    
    // Función para mostrar error
    function showError(message) {
        calendarBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn discord-btn">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
    
    // Función para cambiar de semana
    function changeWeek(direction) {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
        renderCalendar();
    }
    
    // Función para ir a la semana actual
    function goToToday() {
        currentDate = new Date();
        renderCalendar();
    }
    
    // Función para renderizar el calendario
    function renderCalendar() {
        renderWeekHeader();
        renderWeekRange();
        renderEvents();
    }
    
    // Función para renderizar el encabezado de la semana
    function renderWeekHeader() {
        const startOfWeek = getStartOfWeek(currentDate);
        calendarHeader.innerHTML = '<div class="day-header empty"></div>';
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day-header';
            
            // Marcar si es hoy
            const today = new Date();
            if (day.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            dayElement.innerHTML = `
                <span class="date">${day.getDate()}</span>
                <span class="day-name">${getDayName(day)}</span>
            `;
            
            calendarHeader.appendChild(dayElement);
        }
    }
    
    // Función para renderizar el rango de la semana
    function renderWeekRange() {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const options = { month: 'long', day: 'numeric' };
        const startStr = startOfWeek.toLocaleDateString('es-ES', options);
        const endStr = endOfWeek.toLocaleDateString('es-ES', options);
        
        weekRangeElement.textContent = `${startStr} - ${endStr}`;
    }
    
    // Función para renderizar los eventos
    function renderEvents() {
        calendarBody.innerHTML = '';
        
        if (events.length === 0) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay eventos programados para esta semana</p>
                    <button onclick="initCalendar()" class="btn secondary-btn">
                        <i class="fas fa-redo"></i> Recargar eventos
                    </button>
                </div>
            `;
            return;
        }
        
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Filtrar eventos que se superponen con esta semana
        const weekEvents = events.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            
            return (eventStart <= endOfWeek && eventEnd >= startOfWeek);
        });
        
        if (weekEvents.length === 0) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay eventos programados para esta semana</p>
                </div>
            `;
            return;
        }
        
        weekEvents.forEach(event => {
            createEventRow(event, startOfWeek);
        });
    }
    
    // Función para crear una fila de evento
    function createEventRow(event, startOfWeek) {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        const row = document.createElement('div');
        row.className = 'event-row';
        
        // Información del evento
        const infoDiv = document.createElement('div');
        infoDiv.className = 'event-info';
        infoDiv.innerHTML = `
            <div class="event-name">${event.name}</div>
            <div class="event-game">
                <i class="fas ${event.icon}"></i> ${event.game}
            </div>
        `;
        row.appendChild(infoDiv);
        
        // Contenedor para la barra del evento
        const barContainer = document.createElement('div');
        barContainer.className = 'event-days-container';
        
        // Calcular posición y ancho de la barra
        const weekStartTime = startOfWeek.getTime();
        const dayWidth = 100 / 7; // Porcentaje
        
        // Calcular inicio relativo (puede ser negativo si empieza antes de la semana)
        const daysFromWeekStart = Math.floor((eventStart.getTime() - weekStartTime) / (1000 * 60 * 60 * 24));
        const startPosition = Math.max(daysFromWeekStart, 0) * dayWidth;
        
        // Calcular duración en días
        const eventDurationDays = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Duración visible en esta semana
        const visibleStartDay = Math.max(0, -daysFromWeekStart);
        const visibleEndDay = Math.min(7, eventDurationDays - Math.max(0, -daysFromWeekStart));
        const visibleDuration = visibleEndDay - visibleStartDay;
        
        if (visibleDuration > 0) {
            const barWidth = visibleDuration * dayWidth;
            
            const bar = document.createElement('div');
            bar.className = 'event-bar';
            bar.style.left = `${startPosition}%`;
            bar.style.width = `${barWidth}%`;
            bar.style.background = event.color;
            bar.innerHTML = `
                <span>
                    <i class="fas ${event.icon}"></i> ${event.name}
                </span>
            `;
            
            // Agregar evento de clic para mostrar detalles
            bar.addEventListener('click', () => showEventDetails(event));
            
            barContainer.appendChild(bar);
        }
        
        row.appendChild(barContainer);
        calendarBody.appendChild(row);
    }
    
    // Función para mostrar detalles del evento
    function showEventDetails(event) {
        // Crear modal si no existe
        let modal = document.getElementById('event-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal';
            modal.className = 'event-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Detalles del Evento</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="event-details" id="event-details-content"></div>
                        <div class="event-description" id="event-description-content"></div>
                        <div class="modal-actions">
                            <button class="btn secondary-btn" id="close-modal-btn">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Event listeners para cerrar modal
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.querySelector('#close-modal-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Llenar contenido del modal
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        document.getElementById('event-details-content').innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Nombre del Evento</span>
                <span class="detail-value">${event.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Fecha</span>
                <span class="detail-value">${formatDateRange(event.startDate, event.endDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Horario</span>
                <span class="detail-value">${formatTimeRange(event.startTime, event.endTime)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Duración</span>
                <span class="detail-value">${calculateDuration(event.startDate, event.endDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipo</span>
                <span class="detail-value" style="color: ${event.color}">
                    <i class="fas ${event.icon}"></i> ${getEventTypeName(event.type)}
                </span>
            </div>
        `;
        
        document.getElementById('event-description-content').innerHTML = `
            <h4>Descripción</h4>
            <p>${event.description}</p>
        `;
        
        // Mostrar modal
        modal.style.display = 'flex';
    }
    
    // Función para renderizar la leyenda
    function renderLegend() {
        // Agrupar eventos por color para la leyenda
        const colorMap = {};
        
        events.forEach(event => {
            if (!colorMap[event.color]) {
                colorMap[event.color] = {
                    color: event.color,
                    icon: event.icon,
                    count: 0
                };
            }
            colorMap[event.color].count++;
        });
        
        legendItemsElement.innerHTML = '';
        
        Object.values(colorMap).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'legend-item';
            itemElement.innerHTML = `
                <div class="legend-color" style="background: ${item.color}">
                    <i class="fas ${item.icon}"></i>
                </div>
                <span class="legend-text">${item.count} evento(s)</span>
            `;
            legendItemsElement.appendChild(itemElement);
        });
    }
    
    // Funciones auxiliares
    function getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que la semana empiece el lunes
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }
    
    function getDayName(date) {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return days[date.getDay()];
    }
    
    function formatDateRange(startStr, endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        
        if (startStr === endStr) {
            return start.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
            });
        }
        
        const startFormatted = start.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
        const endFormatted = end.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        return `${startFormatted} - ${endFormatted}`;
    }
    
    function formatTimeRange(startTime, endTime) {
        if (!startTime || startTime === 'Por definir') return 'Horario por definir';
        if (!endTime || endTime === 'Por definir') return startTime;
        
        return `${startTime} - ${endTime}`;
    }
    
    function calculateDuration(startStr, endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays === 1) return '1 día';
        return `${diffDays} días`;
    }
    
    function getEventTypeName(typeId) {
        const typeMap = {
            1: 'Torneo',
            2: 'Liga',
            3: 'Evento Especial',
            4: 'Eliminatorio',
            5: 'Clasificatorio'
        };
        return typeMap[typeId] || 'Evento';
    }
    
    // Función para formatear fecha como YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Función para agregar días a una fecha
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
});
[file content end]
