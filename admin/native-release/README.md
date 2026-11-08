# Instantánea publicada del administrador nativo

Versión 1aa678969562, desplegada el 8 de noviembre de 2026 (UTC). Incluye Contenido → Conectores, comprobación de archivos y selector en el publicador, con una sola aplicación y sin documentos administrativos incrustados.

El código fuente editable completo está ahora recuperado en `../native/`; la construcción principal está en `../build-native.mjs`. El constructor de este directorio permite reconstruir la instantánea a partir del runtime y los recursos ya compilados, sin dependencias adicionales.

Las capacidades, límites de proveedores y validaciones están documentados en `../../connectors/README.md` y `../../connectors/validation.json`. TeraBox, OneDrive y MEGA conservan/aperturan el enlace del proveedor; su reproducción nativa todavía no está implementada.
