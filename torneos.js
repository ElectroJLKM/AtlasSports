// Configuración de Supabase
const SUPABASE_URL = "https://uqffsnrhasfqfcswkncf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZzbnJoYXNmcWZjc3drbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzgyMDcsImV4cCI6MjA4NTE1NDIwN30.qVcKz8PuuEOBsObidm7Phmx-pw8iitYkH3Hzyc_E9Ak";

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentWeekStart = new Date();
let events = [];
let eventRows = {};

// Inicializar fecha actual al lunes de la semana actual
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    return new Date(d.setDate(diff));
}

// Formatear fecha
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Formatear fecha para mostrar
function formatDisplayDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Obtener el rango de la semana
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

// Obtener día de la semana
function getDayName(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
}

// Cargar eventos desde Supabase
async function loadEvents() {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_date', { ascending: true });
        
        if (error) throw error;
        
        events = data || [];
        renderCalendar();
    } catch (error) {
        console.error('Error cargando eventos:', error);
        document.getElementById('calendar-body').innerHTML = `
            <div class="no-events">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Error cargando los eventos. Por favor, inténtalo de nuevo más tarde.</p>
            </div>
        `;
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Renderizar encabezado del calendario
function renderCalendarHeader() {
    const header = document.getElementById('calendar-header');
    let html = '<div class="day-header empty"></div>';
    
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        
        const isToday = date.toDateString() === today.toDateString();
        
        html += `
            <div class="day-header ${isToday ? 'today' : ''}">
                <span class="date">${date.getDate()}</span>
                <span class="day">${getDayName(date)}</span>
            </div>
        `;
    }
    
    header.innerHTML = html;
    document.getElementById('week-range').textContent = getWeekRange(currentWeekStart);
}

// Renderizar cuerpo del calendario
function renderCalendarBody() {
    const body = document.getElementById('calendar-body');
    
    // Limpiar filas existentes
    eventRows = {};
    
    // Crear filas para cada evento
    events.forEach(event => {
        const eventId = event.id;
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        // Verificar si el evento cae en la semana actual
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (endDate >= currentWeekStart && startDate <= weekEnd) {
            // Calcular posición y duración
            const eventStart = startDate < currentWeekStart ? currentWeekStart : startDate;
            const eventEnd = endDate > weekEnd ? weekEnd : endDate;
            
            const startDay = Math.max(0, Math.floor((eventStart - currentWeekStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.floor((eventEnd - eventStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Encontrar fila disponible
            let rowIndex = 0;
            while (true) {
                if (!eventRows[rowIndex]) {
                    eventRows[rowIndex] = [];
                }
                
                const conflict = eventRows[rowIndex].some(e => 
                    e.startDay <= startDay + durationDays - 1 && 
                    e.startDay + e.durationDays - 1 >= startDay
                );
                
                if (!conflict) {
                    eventRows[rowIndex].push({
                        eventId,
                        startDay,
                        durationDays,
                        color: event.color || '#5865f2',
                        title: event.title,
                        icon: event.icon
                    });
                    break;
                }
                rowIndex++;
            }
        }
    });
    
    // Renderizar filas
    let html = '';
    const rowCount = Object.keys(eventRows).length;
    
    if (rowCount === 0) {
        html = `
            <div class="no-events">
                <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No hay eventos programados para esta semana.</p>
            </div>
        `;
    } else {
        for (let i = 0; i < rowCount; i++) {
            const event = events.find(e => e.id === eventRows[i][0]?.eventId);
            
            html += `
                <div class="event-row">
                    <div class="event-label">
                        <div class="event-icon" style="background-color: ${event?.color || '#5865f2'}20; color: ${event?.color || '#5865f2'}">
                            <i class="fas fa-gamepad"></i>
                        </div>
                        <div>
                            <div class="event-title">${event?.title || 'Evento'}</div>
                            <div class="event-dates">${formatDisplayDate(new Date(event?.start_date))} - ${formatDisplayDate(new Date(event?.end_date))}</div>
                        </div>
                    </div>
            `;
            
            // Crear celdas de días
            for (let day = 0; day < 7; day++) {
                html += `<div class="day-cell" id="cell-${i}-${day}"></div>`;
            }
            
            html += `</div>`;
        }
    }
    
    body.innerHTML = html;
    
    // Renderizar barras de eventos
    renderEventBars();
    
    // Renderizar leyenda
    renderLegend();
}

// Renderizar barras de eventos
function renderEventBars() {
    Object.keys(eventRows).forEach(rowIndex => {
        eventRows[rowIndex].forEach(eventData => {
            const event = events.find(e => e.id === eventData.eventId);
            if (!event) return;
            
            const startDay = eventData.startDay;
            const durationDays = eventData.durationDays;
            const color = eventData.color;
            const title = eventData.title;
            
            // Calcular posición y tamaño
            const cellWidth = 100 / 7; // Porcentaje del ancho de cada celda
            const left = startDay * cellWidth;
            const width = durationDays * cellWidth;
            
            // Determinar si hay superposición vertical
            const overlapClass = rowIndex % 2 === 0 ? '' : 'overlap-2';
            
            const barHtml = `
                <div class="event-bar ${overlapClass}" 
                     style="left: ${left}%; width: ${width}%; background-color: ${color};"
                     title="${title} (${formatDisplayDate(new Date(event.start_date))} - ${formatDisplayDate(new Date(event.end_date))})">
                    <div class="event-bar-content">
                        <i class="fas fa-gamepad"></i>
                        <span>${title}</span>
                    </div>
                </div>
            `;
            
            // Insertar barra en la primera celda que ocupa
            const firstCell = document.getElementById(`cell-${rowIndex}-${startDay}`);
            if (firstCell) {
                firstCell.innerHTML = barHtml;
                
                // Añadir evento hover
                const bar = firstCell.querySelector('.event-bar');
                bar.addEventListener('mouseenter', function() {
                    // Resaltar todas las barras del mismo evento
                    document.querySelectorAll('.event-bar').forEach(b => {
                        if (b.style.backgroundColor === color && b.title === this.title) {
                            b.style.transform = b.classList.contains('overlap-2') 
                                ? 'translateY(-50%) scale(1.05)' 
                                : 'translateY(-50%) scale(1.05)';
                            b.style.zIndex = '10';
                        }
                    });
                });
                
                bar.addEventListener('mouseleave', function() {
                    document.querySelectorAll('.event-bar').forEach(b => {
                        if (b.style.backgroundColor === color && b.title === this.title) {
                            b.style.transform = b.classList.contains('overlap-2') 
                                ? 'translateY(-50%)' 
                                : 'translateY(-50%)';
                            b.style.zIndex = '2';
                        }
                    });
                });
            }
        });
    });
}

// Renderizar leyenda
function renderLegend() {
    const legendItems = document.getElementById('legend-items');
    const uniqueEvents = [...new Set(events.map(e => ({color: e.color, title: e.title})))];
    
    let html = '';
    uniqueEvents.forEach(event => {
        html += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${event.color || '#5865f2'}"></div>
                <div class="legend-text">${event.title}</div>
            </div>
        `;
    });
    
    legendItems.innerHTML = html;
}

// Renderizar calendario completo
function renderCalendar() {
    renderCalendarHeader();
    renderCalendarBody();
}

// Cambiar semana
function changeWeek(direction) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    renderCalendar();
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Establecer semana actual
    currentWeekStart = getMonday(new Date());
    
    // Cargar eventos
    loadEvents();
    
    // Configurar botones de navegación
    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-1));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(1));
    
    // Botón para volver a hoy
    const todayBtn = document.createElement('button');
    todayBtn.className = 'calendar-btn';
    todayBtn.innerHTML = '<i class="fas fa-calendar-day"></i> Hoy';
    todayBtn.addEventListener('click', () => {
        currentWeekStart = getMonday(new Date());
        renderCalendar();
    });
    
    document.querySelector('.calendar-controls').appendChild(todayBtn);
});
