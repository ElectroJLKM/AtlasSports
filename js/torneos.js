// torneos.js - VERSIÓN CORREGIDA Y FUNCIONAL

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Iniciando calendario...');
    
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

    // === FUNCIONES UTILITARIAS SIMPLES ===
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    function formatDate(date) {
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }

    function getWeekRange(startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    function getDayName(date) {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[date.getDay()];
    }

    function showError(message) {
        const calendarBody = document.getElementById('calendar-body');
        if (calendarBody) {
            calendarBody.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // === CARGAR EVENTOS DESDE SUPABASE ===
    async function loadEvents() {
        console.log('📡 Cargando eventos...');
        
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });
            
            if (error) {
                console.error('Error Supabase:', error);
                
                // Si la tabla no existe, mostrar mensaje amigable
                if (error.code === 'PGRST116' || error.message.includes('no existe')) {
                    showError('La tabla de eventos está vacía o no existe.');
                    return;
                }
                
                throw error;
            }
            
            events = data || [];
            console.log(`✅ ${events.length} eventos cargados`);
            
            renderCalendar();
            
        } catch (error) {
            console.error('Error cargando eventos:', error);
            showError('Error cargando eventos: ' + error.message);
        } finally {
            // Ocultar loading
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }
    }

    // === RENDERIZAR CALENDARIO ===
    function renderCalendarHeader() {
        const header = document.getElementById('calendar-header');
        if (!header) return;
        
        let html = '<div class="day-header empty">Eventos</div>';
        
        // Crear 7 días de la semana
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            
            const dayName = getDayName(date);
            const dayNumber = date.getDate();
            
            html += `
                <div class="day-header">
                    <div style="font-size: 0.9rem; opacity: 0.8;">${dayName}</div>
                    <div style="font-size: 1.3rem; font-weight: bold;">${dayNumber}</div>
                </div>
            `;
        }
        
        header.innerHTML = html;
        
        // Actualizar rango de semana
        const weekRange = document.getElementById('week-range');
        if (weekRange) {
            weekRange.textContent = getWeekRange(currentWeekStart);
        }
    }

    function renderCalendarBody() {
        const body = document.getElementById('calendar-body');
        if (!body) return;
        
        // Limpiar
        body.innerHTML = '';
        
        // Calcular límites de la semana
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Filtrar eventos de esta semana
        const weekEvents = events.filter(event => {
            try {
                const eventStart = new Date(event.start_date);
                const eventEnd = new Date(event.end_date);
                
                // ¿El evento intersecta con esta semana?
                return eventStart <= weekEnd && eventEnd >= weekStart;
            } catch (e) {
                return false;
            }
        });
        
        console.log(`📅 ${weekEvents.length} eventos esta semana`);
        
        if (weekEvents.length === 0) {
            body.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay eventos esta semana</p>
                </div>
            `;
            return;
        }
        
        // Crear una fila por evento (SIMPLE)
        weekEvents.forEach((event, index) => {
            const row = createEventRow(event, index);
            body.appendChild(row);
        });
    }

    function createEventRow(event, rowIndex) {
        const row = document.createElement('div');
        row.className = 'event-row';
        
        // Calcular posición del evento en la semana
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        const weekStart = new Date(currentWeekStart);
        
        // Calcular días desde el inicio de la semana
        const startDay = Math.max(0, Math.floor((eventStart - weekStart) / (1000 * 60 * 60 * 24)));
        const endDay = Math.min(6, Math.floor((eventEnd - weekStart) / (1000 * 60 * 60 * 24)));
        
        const durationDays = Math.max(1, endDay - startDay + 1);
        
        console.log(`Evento: ${event.title}, startDay: ${startDay}, duration: ${durationDays}`);
        
        // Columna de etiqueta
        const labelDiv = document.createElement('div');
        labelDiv.className = 'event-label';
        labelDiv.innerHTML = `
            <div class="event-icon" style="background-color: ${event.color || '#5865f2'}20; color: ${event.color || '#5865f2'}">
                <i class="fas ${event.icon || 'fa-gamepad'}"></i>
            </div>
            <div>
                <div style="font-weight: bold; margin-bottom: 4px;">${event.title}</div>
                <div style="font-size: 0.85rem; opacity: 0.8;">
                    ${formatDate(new Date(event.start_date))}
                    ${event.end_date !== event.start_date ? ' - ' + formatDate(new Date(event.end_date)) : ''}
                </div>
            </div>
        `;
        
        // Columna de días
        const daysDiv = document.createElement('div');
        daysDiv.style.flex = '1';
        daysDiv.style.display = 'flex';
        daysDiv.style.position = 'relative';
        daysDiv.style.minHeight = '80px';
        
        // Crear 7 celdas
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            cell.id = `cell-${rowIndex}-${i}`;
            daysDiv.appendChild(cell);
        }
        
        row.appendChild(labelDiv);
        row.appendChild(daysDiv);
        
        // Añadir barra del evento (después de que el DOM esté listo)
        setTimeout(() => {
            addEventBar(event, rowIndex, startDay, durationDays);
        }, 10);
        
        return row;
    }

    function addEventBar(event, rowIndex, startDay, durationDays) {
        const firstCell = document.getElementById(`cell-${rowIndex}-${startDay}`);
        if (!firstCell) return;
        
        // Calcular dimensiones
        const barWidth = (durationDays * 100) + '%';
        const barLeft = '0px';
        
        // Crear barra
        const bar = document.createElement('div');
        bar.className = 'event-bar';
        bar.style.cssText = `
            position: absolute;
            top: 50%;
            left: ${barLeft};
            width: ${barWidth};
            height: 40px;
            transform: translateY(-50%);
            background: linear-gradient(135deg, ${event.color || '#5865f2'}, ${darkenColor(event.color || '#5865f2', 20)});
            border-radius: 8px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            z-index: ${rowIndex + 2};
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            box-sizing: border-box;
        `;
        
        // Contenido de la barra
        const showTitle = durationDays >= 2;
        bar.innerHTML = `
            <div class="event-bar-content">
                <i class="fas ${event.icon || 'fa-gamepad'}" style="font-size: 0.9rem;"></i>
                ${showTitle ? `<span style="margin-left: 8px; overflow: hidden; text-overflow: ellipsis;">${event.title}</span>` : ''}
            </div>
        `;
        
        // Tooltip
        const tooltip = `${event.title}\n${formatDate(new Date(event.start_date))} - ${formatDate(new Date(event.end_date))}`;
        bar.title = tooltip;
        
        // Hover effects
        bar.addEventListener('mouseenter', () => {
            bar.style.transform = 'translateY(-50%) scale(1.02)';
            bar.style.zIndex = '100';
            bar.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
        });
        
        bar.addEventListener('mouseleave', () => {
            bar.style.transform = 'translateY(-50%)';
            bar.style.zIndex = rowIndex + 2;
            bar.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
        });
        
        // Añadir barra a la celda
        firstCell.appendChild(bar);
        firstCell.style.position = 'relative';
        firstCell.style.overflow = 'visible';
    }

    function darkenColor(color, percent) {
        // Simplemente devolver el color original por ahora
        return color;
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
    
    // Botones de navegación
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    
    if (prevBtn) prevBtn.addEventListener('click', () => changeWeek(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeWeek(1));
    
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
