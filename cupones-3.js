function toggleCajas1() {
        var cajas = document.querySelectorAll('.caja');
        var mostrarButton1 = document.getElementById('mostrar-button1');
        var ocultarButton2 = document.getElementById('ocultar-button2');

        var algunoOculto = Array.from(cajas).some(caja => caja.style.display === 'none' || caja.style.display === '');

        cajas.forEach(function(caja) {
            if (algunoOculto) {
                caja.style.display = 'block';
            } else {
                caja.style.display = 'none';
            }
        });

        if (algunoOculto) {
            mostrarButton1.style.display = 'none';
            ocultarButton2.style.display = 'inline-block';
        } else {
            mostrarButton1.style.display = 'inline-block';
            ocultarButton2.style.display = 'none';
        }
    }