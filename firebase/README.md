# Registro del manual

Proyecto: `cenessod-9fa05`. Firestore Standard, base `(default)`, región `nam5`, plan Spark.

Colección: `manual_registros`. La web utiliza la API REST con una clave pública de Firebase; no contiene credenciales administrativas. Las reglas permiten exclusivamente crear registros con el esquema validado. Lectura, modificación y eliminación desde clientes públicos están denegadas. Los administradores acceden desde la consola de Firebase.

Campos: `email`, `consentimiento`, `consentimientoVersion`, `recurso`, `origen`, `createdAt`. La fecha se asigna en el servidor. La versión `manual-publicaciones-v1` corresponde al texto: “Acepto que CENESSOD use mi correo para enviarme este manual y publicaciones posteriores, conforme al Aviso de privacidad. Puedo darme de baja cuando quiera.” El enlace apunta a `/aviso-de-privacidad/`.

La descarga se inicia únicamente tras recibir confirmación del commit de Firestore. Ante un rechazo, respuesta incompleta o interrupción de red, se conserva el formulario y se permite reintentar. Una respuesta perdida después del guardado puede generar un registro duplicado en un reintento. No se verifica la titularidad del correo ni se envían correos automáticamente.

El PDF continúa siendo un recurso público de GitHub Pages; este flujo es captura de registros, no un control de acceso al archivo.

Antibots en la página (desde 3 oct 2026): campo trampa oculto `lm-website` (honeypot) y tiempo mínimo de 3 s entre la carga y el envío. Si se activan, se muestra el éxito y la descarga pero no se guarda el registro. Ambos filtros viven solo en el navegador: un bot que llame directo a la API REST los evita.

App Check (desde 3 oct 2026): app web `1:102125314463:web:a10a03f91dbae374131daa`, proveedor reCAPTCHA v3 (la clave secreta solo está en la consola de Firebase). El script carga el SDK 12.19.0 desde gstatic al primer foco en el formulario y envía el token en el encabezado `X-Firebase-AppCheck`. Si no obtiene token, envía sin él: el registro solo se rechaza cuando App Check está en modo "Aplicar" para Cloud Firestore. Antes de activarlo, comprobar en App Check → APIs → Cloud Firestore que las solicitudes aparecen como verificadas. Para pruebas locales (localhost) se necesita un token de depuración de App Check.

No hay limitación de solicitudes en servidor. El plan Spark conserva sus límites de uso.

Verificación: pruebas del controlador con `node --experimental-vm-modules scripts/test-manual-registration.cjs`; comprobación real de escritura y rechazo de consultas públicas, correo inválido, consentimiento falso y campos inesperados. Los registros cuyo correo es `prueba-integracion-cenessod@example.invalid` son pruebas técnicas y deben excluirse de listas de contactos.

Reglas desplegadas: `firestore.rules`. Mantener este archivo sincronizado con la consola al modificarlas.
