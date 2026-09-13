# Registro del manual

Proyecto: `cenessod-9fa05`. Firestore Standard, base `(default)`, región `nam5`, plan Spark.

Colección: `manual_registros`. La web utiliza la API REST con una clave pública de Firebase; no contiene credenciales administrativas. Las reglas permiten exclusivamente crear registros con el esquema validado. Lectura, modificación y eliminación desde clientes públicos están denegadas. Los administradores acceden desde la consola de Firebase.

Campos: `email`, `consentimiento`, `consentimientoVersion`, `recurso`, `origen`, `createdAt`. La fecha se asigna en el servidor. La versión `manual-publicaciones-v1` corresponde al texto: “Acepto que CENESSOD use mi correo para enviarme este manual y publicaciones posteriores, conforme al Aviso de privacidad. Puedo darme de baja cuando quiera.” El enlace apunta a `/aviso-de-privacidad/`.

La descarga se inicia únicamente tras recibir confirmación del commit de Firestore. Ante un rechazo, respuesta incompleta o interrupción de red, se conserva el formulario y se permite reintentar. Una respuesta perdida después del guardado puede generar un registro duplicado en un reintento. No se verifica la titularidad del correo ni se envían correos automáticamente.

El PDF continúa siendo un recurso público de GitHub Pages; este flujo es captura de registros, no un control de acceso al archivo.

No hay App Check ni limitación de solicitudes en servidor; la validación del esquema no es una protección contra bots. Para campañas con tráfico elevado, configurar App Check antes de ampliar cuotas o habilitar facturación. El plan Spark conserva sus límites de uso.

Verificación: pruebas del controlador con `node scripts/test-manual-registration.cjs`; comprobación real de escritura y rechazo de consultas públicas, correo inválido, consentimiento falso y campos inesperados. Los registros cuyo correo es `prueba-integracion-cenessod@example.invalid` son pruebas técnicas y deben excluirse de listas de contactos.

Reglas desplegadas: `firestore.rules`. Mantener este archivo sincronizado con la consola al modificarlas.
