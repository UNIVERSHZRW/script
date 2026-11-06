# Integración con el encabezado global UNIVERSHZRW

El Worker Cloudflare existente `univershzrw-comunichat-nav` se actualizó para **no excluir** `/criptomoneda` y `/criptomoneda/terminal` de la navegación global. Se mantienen excluidos `/economia/moneda` y `/criptomoneda/pieza-fisica` en la condición de exclusión.

El HTML de INFINITO usa exactamente los mismos assets compartidos que el resto del sitio: `/_uhz/shared-header.css`, `/_uhz/shared-header.js`. La portada `/criptomoneda` redirige a `/criptomoneda/terminal` (302); la guía y la transparencia conservan sus propias rutas e incluyen el encabezado común.

**Condición de cambio aplicada al script existente:**

```js
if(/^\\/(?:economia\\/moneda|criptomoneda\\/pieza-fisica)(?:\\/|$)/.test(path))return;
```

El resto del Worker compartido no se versiona aquí porque pertenece a la infraestructura transversal de UNIVERSHZRW.
