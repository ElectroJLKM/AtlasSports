[file name]: torneos.js
[file content begin]
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const calendarHeader = document.getElementById('calendar-header');
    const calendarBody = document.getElementById('calendar-body');
    const weekRangeElement = document.getElementById('week-range');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const legendItemsElement = document.getElementById('legend-items');
    const loadingElement = document.getElementById('loading');
    
    // Estado del calendario
    let currentDate = new Date();
    let events = [];
    
    // Tipos de eventos con colores
    const eventTypes = [
        { id: 1, name: 'Torneo Abierto', color: '#5865f2' },
        { id: 2, name: 'Liga Regular', color: '#10b981' },
        { id: 3, name: 'Evento Especial', color: '#f59e0b' },
        { id: 4, name: 'Torneo Eliminatorio', color: '#ef4444' },
        { id: 5, name: 'Clasificatorio', color: '#8b5cf6' }
    ];
    
    // Datos de ejemplo (reemplazar con datos de Supabase)
    const sampleEvents = [
        {
            id: 1,
            name: 'Torneo Duck Game Semanal',
            game: 'Duck Game',
            type: 1,
            startDate: getDateString(0),
            endDate: getDateString(0),
            description: 'Torneo semanal abierto a todos los jugadores. Modalidad eliminación directa.',
            time: '20:00',
            prize: 'Premium Discord + $50',
            participants: 'Abierto'
        },
        {
            id: 2,
            name: 'Liga Duck Game Primavera',
            game: 'Duck Game',
            type: 2,
            startDate: getDateString(-2),
            endDate: getDateString(3),
            description: 'Liga de temporada con equipos y partidos programados.',
            time: 'Todo el día',
            prize: '$500 + Trofeo',
            participants: '16 equipos'
        },
        {
            id: 3,
            name: 'Torneo 1v1 Eliminatorio',
            game: 'Duck Game',
            type: 4,
            startDate: getDateString(1),
            endDate: getDateString(1),
            description: 'Competencia 1 contra 1, mejor de 3 rondas.',
            time: '18:00',
            prize: '$100',
            participants: '32 jugadores'
        },
        {
            id: 4,
            name: 'Clasificatorio Regional',
            game: 'Duck Game',
            type: 5,
            startDate: getDateString(4),
            endDate: getDateString(5),
            description: 'Clasificatorio para el campeonato regional.',
            time: '16:00',
            prize: 'Pase al Regional',
            participants: 'Abierto'
        },
        {
            id: 5,
            name: 'Evento Especial: Modo Caos',
            game: 'Duck Game',
            type: 3,
            startDate: getDateString(6),
            endDate: getDateString(8),
            description: 'Evento especial con modos de juego personalizados y reglas únicas.',
            time: '21:00',
            prize: 'Ítems exclusivos',
            participants: 'Ilimitado'
        }
    ];
    
    // Inicialización
    initCalendar();
    
    // Event Listeners
    prevWeekBtn.addEventListener('click', () => changeWeek(-1));
    nextWeekBtn.addEventListener('click', () => changeWeek(1));
    
    // Función para obtener fecha en formato YYYY-MM-DD
    function getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
    
    // Función de inicialización
    function initCalendar() {
        loadEvents();
        renderCalendar();
        renderLegend();
    }
    
    // Función para cargar eventos (ejemplo, integrar con Supabase después)
    function loadEvents() {
        // Simular carga de datos
        loadingElement.style.display = 'flex';
        
        setTimeout(() => {
            events = sampleEvents;
            loadingElement.style.display = 'none';
            renderCalendar();
        }, 800);
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
        
        // Agregar botón "Hoy" si no está presente
        if (!document.getElementById('today-btn')) {
            const todayBtn = document.createElement('button');
            todayBtn.id = 'today-btn';
            todayBtn.className = 'calendar-btn';
            todayBtn.innerHTML = '<i class="fas fa-calendar-day"></i> Hoy';
            todayBtn.addEventListener('click', goToToday);
            
            const controls = document.querySelector('.calendar-controls');
            controls.insertBefore(todayBtn, controls.children[1]);
        }
    }
    
    // Función para renderizar los eventos
    function renderEvents() {
        calendarBody.innerHTML = '';
        
        if (events.length === 0) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay eventos programados para esta semana</p>
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
            <div class="event-game">${event.game}</div>
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
            bar.className = `event-bar event-type-${event.type}`;
            bar.style.left = `${startPosition}%`;
            bar.style.width = `${barWidth}%`;
            bar.innerHTML = `<span>${event.name}</span>`;
            
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
                            <button class="btn discord-btn" id="register-event-btn">
                                <i class="fas fa-user-plus"></i> Inscribirse
                            </button>
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
            
            document.getElementById('register-event-btn').addEventListener('click', () => {
                alert(`Inscripción al evento: ${event.name}`);
                // Aquí integrarías con Supabase para inscripciones
            });
        }
        
        // Llenar contenido del modal
        const eventType = eventTypes.find(t => t.id === event.type);
        
        document.getElementById('event-details-content').innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Nombre del Evento</span>
                <span class="detail-value">${event.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Juego</span>
                <span class="detail-value">${event.game}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipo</span>
                <span class="detail-value" style="color: ${eventType.color}">${eventType.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Fecha</span>
                <span class="detail-value">${formatDateRange(event.startDate, event.endDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Hora</span>
                <span class="detail-value">${event.time}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Premio</span>
                <span class="detail-value">${event.prize}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Participantes</span>
                <span class="detail-value">${event.participants}</span>
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
        legendItemsElement.innerHTML = '';
        
        eventTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-color" style="background: ${type.color}"></div>
                <span class="legend-text">${type.name}</span>
            `;
            legendItemsElement.appendChild(item);
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
            return start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        }
        
        const startFormatted = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const endFormatted = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return `${startFormatted} - ${endFormatted}`;
    }
    
    // Integración con Supabase (ejemplo básico)
    async function fetchEventsFromSupabase() {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) throw error;
            
            // Transformar datos de Supabase al formato esperado
            return data.map(event => ({
                id: event.id,
                name: event.name,
                game: event.game,
                type: event.type_id,
                startDate: event.start_date,
                endDate: event.end_date,
                description: event.description,
                time: event.time,
                prize: event.prize,
                participants: event.max_participants
            }));
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            return [];
        }
    }
});
[file content end]
