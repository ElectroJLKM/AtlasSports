// torneos.js - Versión mejorada con visualización de duración

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
    let eventRows = {};

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
        
        try {
            // Manejar diferentes formatos de tiempo
            const parts = timeString.split(':');
            if (parts.length >= 2) {
                const hour = parts[0].padStart(2, '0');
                const minute = parts[1].padStart(2, '0');
                return `${hour}:${minute}`;
            }
            return timeString;
        } catch (error) {
            console.error('Error formateando hora:', timeString, error);
            return timeString;
        }
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
        document.getElementById('calendar-body').innerHTML = `
            <div class="no-events">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${message}</p>
            </div>
        `;
        document.getElementById('loading').style.display = 'none';
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
                
                // Verificar si la tabla existe
                if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
                    showError('La tabla de eventos no existe. Contacta al administrador.');
                    return;
                }
                throw error;
            }
            
            console.log(`✅ ${data?.length || 0} eventos cargados`);
            events = data || [];
            
            if (events.length === 0) {
                console.log('ℹ️ No hay eventos en la base de datos');
                // Mostrar mensaje en lugar de error
                document.getElementById('loading').style.display = 'none';
            } else {
                // Debug: mostrar información de eventos
                console.log('📅 Eventos recibidos:', events);
                events.forEach((event, i) => {
                    console.log(`Evento ${i}:`, {
                        id: event.id,
                        title: event.title,
                        start_date: event.start_date,
                        end_date: event.end_date,
                        start_time: event.start_time,
                        end_time: event.end_time
                    });
                });
            }
            
            renderCalendar();
            
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            showError('Error cargando los eventos: ' + error.message);
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    // === CALCULAR DURACIÓN EN DÍAS ===
    function calcularDiasDuracion(event) {
        if (!event.start_date || !event.end_date) return 1;
        
        try {
            // Parsear fechas correctamente (manejar formato YYYY-MM-DD)
            const startStr = event.start_date.length === 10 ? event.start_date + 'T00:00:00' : event.start_date;
            const endStr = event.end_date.length === 10 ? event.end_date + 'T23:59:59' : event.end_date;
            
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('Fechas inválidas:', event.start_date, event.end_date);
                return 1;
            }
            
            // Calcular diferencia en días (inclusive)
            const diffTime = endDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            return Math.max(1, diffDays);
        } catch (error) {
            console.error('Error calculando duración:', error, event);
            return 1;
        }
    }

    // === RENDERIZAR CALENDARIO ===
    function renderCalendarHeader() {
        const header = document.getElementById('calendar-header');
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
        document.getElementById('week-range').textContent = getWeekRange(currentWeekStart);
    }

    function renderCalendarBody() {
        const body = document.getElementById('calendar-body');
        
        eventRows = {};
        
        // Calcular posición de cada evento
        events.forEach(event => {
            const eventId = event.id;
            
            // Parsear fechas correctamente
            const startStr = event.start_date.length === 10 ? event.start_date + 'T00:00:00' : event.start_date;
            const endStr = event.end_date.length === 10 ? event.end_date + 'T23:59:59' : event.end_date;
            
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            
            // Si las fechas no son válidas, saltar
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn(`Evento ${event.id} tiene fechas inválidas:`, event.start_date, event.end_date);
                return;
            }
            
            // Calcular límites de la semana (lunes 00:00 a domingo 23:59)
            const weekStart = new Date(currentWeekStart);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            // Verificar si el evento intersecta con esta semana
            if (endDate < weekStart || startDate > weekEnd) {
                return; // Evento fuera de esta semana
            }
            
            // Calcular días de inicio y duración VISIBLES en esta semana
            const visibleStartDate = startDate < weekStart ? weekStart : startDate;
            const visibleEndDate = endDate > weekEnd ? weekEnd : endDate;
            
            // Calcular posición horizontal (días desde el lunes)
            const startDay = Math.max(0, Math.floor((visibleStartDate - weekStart) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.floor((visibleEndDate - visibleStartDate) / (1000 * 60 * 60 * 24)) + 1;
            
            // Debug
            console.log(`Evento "${event.title}":`, {
                startDay,
                durationDays,
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
                weekStart: weekStart.toLocaleDateString(),
                weekEnd: weekEnd.toLocaleDateString()
            });
            
            // Buscar fila sin conflictos
            let rowIndex = 0;
            while (true) {
                if (!eventRows[rowIndex]) {
                    eventRows[rowIndex] = [];
                }
                
                // Verificar si hay conflicto en esta fila
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
                        icon: event.icon || 'fa-gamepad',
                        startTime: event.start_time,
                        endTime: event.end_time,
                        description: event.description
                    });
                    break;
                }
                rowIndex++;
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
                    <p class="small-text">Agrega eventos desde el panel de administración.</p>
                </div>
            `;
        } else {
            // Crear una fila por cada nivel de eventos
            for (let i = 0; i < rowCount; i++) {
                const rowEvents = eventRows[i];
                if (rowEvents.length === 0) continue;
                
                const firstEventData = rowEvents[0];
                const event = events.find(e => e.id === firstEventData.eventId);
                
                if (!event) continue;
                
                html += `
                    <div class="event-row">
                        <div class="event-label">
                            <div class="event-icon" style="background-color: ${firstEventData.color}20; color: ${firstEventData.color}">
                                <i class="fas ${firstEventData.icon}"></i>
                            </div>
                            <div class="event-info">
                                <div class="event-title">${event.title}</div>
                                <div class="event-dates">${formatDisplayDate(new Date(event.start_date))} - ${formatDisplayDate(new Date(event.end_date))}</div>
                                ${event.start_time ? `<div class="event-time">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</div>` : ''}
                            </div>
                        </div>
                `;
                
                // Crear 7 celdas (una por día)
                for (let day = 0; day < 7; day++) {
                    html += `<div class="day-cell" id="cell-${i}-${day}"></div>`;
                }
                
                html += `</div>`;
            }
        }
        
        body.innerHTML = html;
        document.getElementById('loading').style.display = 'none';
        
        renderEventBars();
        renderLegend();
    }

    function renderEventBars() {
        // Limpiar celdas primero
        document.querySelectorAll('.day-cell').forEach(cell => {
            cell.innerHTML = '';
        });
        
        // Dibujar cada barra de evento
        Object.keys(eventRows).forEach(rowIndex => {
            const rowEvents = eventRows[rowIndex];
            
            rowEvents.forEach(eventData => {
                const event = events.find(e => e.id === eventData.eventId);
                if (!event) return;
                
                const startDay = eventData.startDay;
                const durationDays = eventData.durationDays;
                const color = eventData.color;
                
                // Crear tooltip con información completa
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);
                const startTime = event.start_time ? formatTime(event.start_time) : '';
                const endTime = event.end_time ? formatTime(event.end_time) : '';
                
                const tooltip = `
${event.title}
📅 ${formatDisplayDate(startDate)}${startTime ? ' ' + startTime : ''}
➡ ${formatDisplayDate(endDate)}${endTime ? ' ' + endTime : ''}
${event.description ? '📝 ' + event.description : ''}
`.trim();
                
                // Calcular posición y tamaño de la barra
                const cellWidth = 100 / 7; // 14.2857% por día
                const left = startDay * cellWidth;
                const width = durationDays * cellWidth;
                
                // Clase para barras superpuestas (alternar)
                const overlapClass = parseInt(rowIndex) % 2 === 0 ? '' : 'overlap-2';
                
                // Determinar si mostrar el título en la barra
                const showTitle = durationDays <= 2 || width > 30;
                
                const barHtml = `
                    <div class="event-bar ${overlapClass}" 
                         style="left: ${left}%; width: ${width}%; background-color: ${color};"
                         title="${tooltip.replace(/\n/g, '&#10;')}">
                        <div class="event-bar-content">
                            <i class="fas ${eventData.icon}"></i>
                            ${showTitle ? `<span class="event-bar-title">${event.title}</span>` : ''}
                        </div>
                    </div>
                `;
                
                // Insertar en la primera celda que toca el evento
                const firstCell = document.getElementById(`cell-${rowIndex}-${startDay}`);
                if (firstCell) {
                    firstCell.innerHTML = barHtml;
                    
                    // Añadir efectos hover
                    const bar = firstCell.querySelector('.event-bar');
                    if (bar) {
                        bar.addEventListener('mouseenter', function() {
                            this.style.transform = 'translateY(-50%) scale(1.05)';
                            this.style.zIndex = '10';
                            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                        });
                        
                        bar.addEventListener('mouseleave', function() {
                            this.style.transform = 'translateY(-50%)';
                            this.style.zIndex = '2';
                            this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                        });
                    }
                }
            });
        });
    }

    function renderLegend() {
        const legendItems = document.getElementById('legend-items');
        const uniqueEvents = [...new Map(events.map(e => [e.title, {
            color: e.color || '#5865f2',
            title: e.title,
            icon: e.icon || 'fa-gamepad'
        }])).values()];
        
        let html = '';
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
        
        legendItems.innerHTML = html || '<div class="no-events"><p>No hay eventos para mostrar en la leyenda</p></div>';
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
