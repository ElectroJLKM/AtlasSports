// torneos.js - VERSIÓN ULTRA SIMPLE Y FUNCIONAL

document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendario cargando...');
    
    // Datos de ejemplo (elimina esto cuando Supabase funcione)
    const eventosEjemplo = [
        {
            id: 1,
            title: "Torneo Duck Game",
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            color: "#5865f2",
            icon: "fa-gamepad"
        },
        {
            id: 2,
            title: "Finales Regionales",
            start_date: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
            end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            color: "#3aa55d",
            icon: "fa-trophy"
        }
    ];
    
    // Usa datos de ejemplo temporalmente
    setTimeout(() => {
        mostrarEventos(eventosEjemplo);
    }, 500);
    
    function mostrarEventos(eventos) {
        const calendarBody = document.getElementById('calendar-body');
        if (!calendarBody) return;
        
        calendarBody.innerHTML = '';
        
        eventos.forEach((evento, index) => {
            const row = document.createElement('div');
            row.className = 'event-row';
            row.innerHTML = `
                <div class="event-label">
                    <div class="event-icon" style="background-color: ${evento.color}20; color: ${evento.color}">
                        <i class="fas ${evento.icon}"></i>
                    </div>
                    <div>
                        <div style="font-weight: bold;">${evento.title}</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">
                            ${new Date(evento.start_date).toLocaleDateString('es-ES')}
                        </div>
                    </div>
                </div>
                <div class="day-cell" style="flex: 1; position: relative; min-height: 80px;">
                    <div class="event-bar" style="
                        position: absolute;
                        top: 50%;
                        left: 0;
                        width: 200px;
                        height: 40px;
                        background: ${evento.color};
                        border-radius: 8px;
                        transform: translateY(-50%);
                        display: flex;
                        align-items: center;
                        padding: 0 12px;
                        color: white;
                        z-index: 2;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    ">
                        <i class="fas ${evento.icon}"></i>
                        <span style="margin-left: 8px;">${evento.title}</span>
                    </div>
                </div>
            `;
            
            calendarBody.appendChild(row);
        });
        
        // Ocultar loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
});
