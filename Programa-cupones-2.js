function toggleCajas() {
        var cajas = document.querySelectorAll('.caja');
        var mostrarButton = document.getElementById('mostrar-button');
        var ocultarButton = document.getElementById('ocultar-button');

        var algunoOculto = Array.from(cajas).some(caja => caja.style.display === 'none' || caja.style.display === '');

        cajas.forEach(function(caja) {
            if (algunoOculto) {
                caja.style.display = 'block';
            } else {
                caja.style.display = 'none';
            }
        });

        if (algunoOculto) {
            mostrarButton.style.display = 'none';
            ocultarButton.style.display = 'inline-block';
        } else {
            mostrarButton.style.display = 'inline-block';
            ocultarButton.style.display = 'none';
        }
    }