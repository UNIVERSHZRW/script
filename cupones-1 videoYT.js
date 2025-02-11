let contador = 1; // Contador para cupones
    let generado = false; // Bandera para evitar regeneración
    let generatedPassword = ""; // Almacenar la contraseña generada

    // Función para generar una contraseña única
    function generateUniqueToken() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < 10; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return token;
    }

    // Función para redirigir al video y generar la contraseña después de un tiempo
    function handleRedirect() {
      // Mostrar el contenedor de carga
      const gearContainer = document.getElementById("gear-container");
      const passwordDisplay = document.getElementById("passwordDisplay");

      gearContainer.style.display = "flex"; // Mostrar animación de carga

      // Redirigir al video en una nueva pestaña
      window.open("https://youtu.be/p-LNToXc_Zc?si=iI215gRnOl9-aKn0", "_blank", "width=1080,height=720");

      // Simular un tiempo de carga antes de mostrar la contraseña
      setTimeout(() => {
        generatedPassword = generateUniqueToken(); // Generar una contraseña única
        gearContainer.style.display = "none"; // Ocultar animación
        document.getElementById("password").textContent = generatedPassword; // Mostrar la contraseña
        passwordDisplay.style.display = "block"; // Mostrar la contraseña generada
      }, 4000); // Cambia el tiempo aquí (en milisegundos)
    }

    // Función para generar un cupón único
    function generateCoupon() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return `${contador.toString().padStart(4, '0')}-${result}`;
    }

    // Función para validar la contraseña y generar el cupón
    function validatePasswordAndGenerateCoupon() {
      const enteredPassword = document.getElementById("passwordInput").value;

      if (enteredPassword !== generatedPassword) {
        alert("La contraseña ingresada no es correcta. Por favor, verifica e intenta nuevamente.");
      } else {
        // Generar el cupón único
        const coupon = generateCoupon();
        document.getElementById("cuponDisplay").innerText = `Cupón único generado: ${coupon}`;
        contador++; // Incrementar el contador para el siguiente cupón
        generado = true; // Bloquear generación adicional
        document.getElementById("botonGenerar").disabled = true; // Desactivar el botón
        document.getElementById("passwordDisplay").style.display = "none"; // Ocultar la contraseña después de usarla
        generatedPassword = ""; // Limpiar la contraseña para que no pueda ser reutilizada
        document.getElementById("botonEnviarCerrar").style.display = "inline-block"; // Mostrar botón de enviar y cerrar
      }
    }

    // Función para reiniciar el formulario
    function resetForm() {
      generado = false;
      document.getElementById("cuponDisplay").innerText = "";
      document.getElementById("formularioCupon").reset();
      document.getElementById("botonGenerar").disabled = false;
      document.getElementById("passwordDisplay").style.display = "none"; // Ocultar la contraseña
      generatedPassword = ""; // Limpiar la contraseña
      document.getElementById("botonEnviarCerrar").style.display = "none"; // Ocultar botón de enviar y cerrar
    }

   // Función para redirigir y cerrar
function redirectAndClose() {
  window.open("https://chat.whatsapp.com/FK7YX2OOTLj71wL2I2BZXL", "_blank"); // Abre la URL en una nueva pestaña
  window.close(); // Cierra la ventana actual
    }