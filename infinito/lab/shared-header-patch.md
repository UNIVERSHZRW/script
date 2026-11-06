# Integración UNIVERSHZRW · noviembre 2026

La navegación global existente `univershzrw-comunichat-nav` se actualizó para **mostrar el encabezado original** en las rutas `/criptomoneda*`; solo permanece excluida la ruta antigua `/economia/moneda`.

Se añadió al arreglo `window.UHZModules` el módulo `INFINITO · Laboratorio` en el grupo `Coins`, con ruta `/criptomoneda`.

Las páginas `/criptomoneda/transparencia`, `/criptomoneda/guia` y `/criptomoneda/pieza-fisica` reciben los estilos y script del encabezado compartido. El acceso `/criptomoneda` redirige a la terminal.

El formulario de la terminal autentica directamente con el servicio **existente** de cuentas mediante la vinculación privada `AUTH_APP`; la cuenta y sus cookies son las mismas de UNIVERSHZRW. El menú móvil se compacta desde el código de la terminal, sin modificar las demás páginas del sitio.

El Worker `univershzrw-economia` ahora añade el acceso `INFINITO · Laboratorio` en los paneles `/economia` y `/comprar-coins`. Estas modificaciones del sitio son limitadas a enlaces y presentación: no se alteraron precios reales, saldos reales ni mecanismos de compra.

Este archivo documenta cambios en Workers compartidos, los cuales se administran y versionan fuera de esta subcarpeta.
