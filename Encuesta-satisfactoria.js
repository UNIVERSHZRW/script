document.getElementById('surveyForm').addEventListener('submit', function (event) {
            event.preventDefault();

            // Obtener valores del formulario
            const formData = new FormData(document.getElementById('surveyForm'));
            const formEntries = Object.fromEntries(formData.entries());

            // Validar teléfono
            const phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(formEntries.phone)) {
                alert('Por favor, ingrese un número de teléfono válido de 10 dígitos.');
                return;
            }

            // Formatear mensaje para WhatsApp
            let message = 'Encuesta de Satisfacción\n';
            for (const [key, value] of Object.entries(formEntries)) {
                message += `${key}: ${value}\n`;
            }

            // Codificar mensaje para URL
            const encodedMessage = encodeURIComponent(message);

            // Número de teléfono de destino en formato internacional
            const whatsappNumber = '524931431385'; // Reemplaza con tu número de WhatsApp

            // Enviar mensaje por WhatsApp
            window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
        });

        // Mostrar/ocultar campos adicionales
        document.getElementById('recommendYes').addEventListener('change', function () {
            document.getElementById('whatsappShareGroup').classList.remove('hidden');
            document.getElementById('recommendWhyGroup').classList.add('hidden');
        });

        document.getElementById('recommendNo').addEventListener('change', function () {
            document.getElementById('recommendWhyGroup').classList.remove('hidden');
            document.getElementById('whatsappShareGroup').classList.add('hidden');
        });

        // Botón para compartir en WhatsApp
        document.getElementById('whatsappShareButton').addEventListener('click', function () {
            const message = encodeURIComponent("¡Hola! Te recomiendo este servicio, es increíble. ¡Échale un vistazo! https://univershzrw.wixsite.com/univershzrw");
            window.open(`https://wa.me/?text=${message}`, '_blank');
        });