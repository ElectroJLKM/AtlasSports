// torneos.js - Usa config.js

// Esperar a que el DOM y Supabase estén cargados
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializar Supabase
    let supabase = getSupabaseClient();
    
    if (!supabase) {
        console.error('❌ Error: Supabase no inicializado. Asegúrate de cargar config.js primero');
        // Intentar inicializar de nuevo
        supabase = initSupabase();
        
        if (!supabase) {
            showError('Error de configuración. Recarga la página.');
            return;
        }
    }
    
    // Variables globales
    let currentWeekStart = new Date();
    let events = [];
    let eventRows = {};

    // Inicializar fecha actual al lunes de la semana actual
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

    // Mostrar error
    function showError(message) {
        document.getElementById('calendar-body').innerHTML = `
            <div class="no-events">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Cargar eventos desde Supabase
    async function loadEvents() {
        try {
            console.log('🔍 Cargando eventos desde Supabase...');
            
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) {
                console.error('Error de Supabase:', error);
                
                // Verificar si la tabla existe
                if (error.code === 'PGRST116') {
                    showError('La tabla de eventos no existe. Contacta al administrador.');
                    return;
                }
                throw error;
            }
            
            console.log(`✅ ${data?.length || 0} eventos cargados`);
            events = data || [];
            
            if (events.length === 0) {
                console.log('ℹ️ No hay eventos en la base de datos');
            }
            
            renderCalendar();
        } catch (error) {
            console.error('Error cargando eventos:', error);
            showError('Error cargando los eventos. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    // Resto del código de renderizado (sin cambios)
    // ... [mantén las funciones renderCalendarHeader, renderCalendarBody, etc.] ...

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
        
        eventRows = {};
        
        events.forEach(event => {
            const eventId = event.id;
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            if (endDate >= currentWeekStart && startDate <= weekEnd) {
                const eventStart = startDate < currentWeekStart ? currentWeekStart : startDate;
                const eventEnd = endDate > weekEnd ? weekEnd : endDate;
                
                const startDay = Math.max(0, Math.floor((eventStart - currentWeekStart) / (1000 * 60 * 60 * 24)));
                const durationDays = Math.floor((eventEnd - eventStart) / (1000 * 60 * 60 * 24)) + 1;
                
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
        
        let html = '';
        const rowCount = Object.keys(eventRows).length;
        
        if (rowCount === 0) {
            html = `
                <div class="no-events">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No hay eventos programados para esta semana.</p>
                    <p class="small-text">Agrega eventos desde el panel de administración.</p>
                </div>
            `;
        } else {
            for (let i = 0; i < rowCount; i++) {
                const rowEvents = eventRows[i].map(e => events.find(event => event.id === e.eventId));
                const firstEvent = rowEvents[0];
                
                html += `
                    <div class="event-row">
                        <div class="event-label">
                            <div class="event-icon" style="background-color: ${firstEvent?.color || '#5865f2'}20; color: ${firstEvent?.color || '#5865f2'}">
                                <i class="fas fa-gamepad"></i>
                            </div>
                            <div>
                                <div class="event-title">${firstEvent?.title || 'Evento'}</div>
                                <div class="event-dates">${formatDisplayDate(new Date(firstEvent?.start_date))} - ${formatDisplayDate(new Date(firstEvent?.end_date))}</div>
                            </div>
                        </div>
                `;
                
                for (let day = 0; day < 7; day++) {
                    html += `<div class="day-cell" id="cell-${i}-${day}"></div>`;
                }
                
                html += `</div>`;
            }
        }
        
        body.innerHTML = html;
        
        renderEventBars();
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
                
                const cellWidth = 100 / 7;
                const left = startDay * cellWidth;
                const width = durationDays * cellWidth;
                
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
                
                const firstCell = document.getElementById(`cell-${rowIndex}-${startDay}`);
                if (firstCell) {
                    firstCell.innerHTML = barHtml;
                    
                    const bar = firstCell.querySelector('.event-bar');
                    bar.addEventListener('mouseenter', function() {
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
        const uniqueEvents = [...new Map(events.map(e => [e.title, {color: e.color, title: e.title}])).values()];
        
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
    currentWeekStart = getMonday(new Date());
    
    // Asignar eventos a los botones
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
