// torneos.js - VERSIÓN SIMPLE DE PRUEBA
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendario cargando...');
    
    // Datos de ejemplo
    const eventos = [
        {
            title: "Torneo Semanal",
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            color: "#5865f2",
            icon: "fa-gamepad"
        }
    ];
    
    // Mostrar encabezado
    const header = document.getElementById('calendar-header');
    if (header) {
        header.innerHTML = `
            <div class="day-header empty">Evento</div>
            <div class="day-header">Lun</div>
            <div class="day-header">Mar</div>
            <div class="day-header">Mié</div>
            <div class="day-header">Jue</div>
            <div class="day-header">Vie</div>
            <div class="day-header">Sáb</div>
            <div class="day-header">Dom</div>
        `;
    }
    
    // Mostrar eventos
    const body = document.getElementById('calendar-body');
    if (body) {
        body.innerHTML = '';
        
        eventos.forEach((evento, index) => {
            body.innerHTML += `
                <div class="event-row">
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
                    <div class="day-cell" style="position: relative;">
                        <div class="event-bar" style="
                            left: 0;
                            width: 200px;
                            background-color: ${evento.color};
                        ">
                            <i class="fas ${evento.icon}"></i>
                            <span style="margin-left: 8px;">${evento.title}</span>
                        </div>
                    </div>
                    <div class="day-cell"></div>
                    <div class="day-cell"></div>
                    <div class="day-cell"></div>
                    <div class="day-cell"></div>
                    <div class="day-cell"></div>
                    <div class="day-cell"></div>
                </div>
            `;
        });
        
        // Ocultar loading
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
    
    console.log('Calendario renderizado');
});
