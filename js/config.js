/* =========================================================
   CONFIGURACIÓN DE LA TIENDA
   ---------------------------------------------------------
   Este es el ÚNICO archivo que necesitas editar para poner
   los datos reales de tu negocio. Cambia lo que está entre
   comillas y guarda.
   ========================================================= */

window.TIENDA_CONFIG = {
  // Nombre que aparece en el encabezado, el pie de página y el mensaje de WhatsApp
  nombre: "Juguetería Demo",

  // Frase corta debajo del nombre
  eslogan: "Juguetes que alegran el día",

  // Número de WhatsApp del propietario en formato internacional:
  // 57 (Colombia) + número de 10 dígitos. SIN espacios, guiones ni "+".
  // Ejemplo: "573001234567"
  whatsapp: "573001234567",

  // Cómo se muestra el teléfono en la página (este sí puede llevar espacios)
  telefonoVisible: "300 123 4567",

  // Correo de contacto (para el pie de página y la política de datos)
  correo: "contacto@tutienda.com",

  // Dirección donde los clientes recogen sus pedidos
  direccion: "Calle 00 # 00-00, Barrio Ejemplo",
  ciudad: "Bogotá, Colombia",

  // Enlace de Google Maps de tu tienda (opcional). Déjalo "" si no tienes.
  mapaUrl: "",

  // Horarios de atención y de recogida
  horarios: [
    { dias: "Lunes a viernes", horas: "9:00 a. m. – 7:00 p. m." },
    { dias: "Sábados", horas: "9:00 a. m. – 5:00 p. m." },
    { dias: "Domingos y festivos", horas: "Cerrado" }
  ],

  // Instrucciones que verá el cliente antes de enviar el pedido
  instruccionesRecogida: [
    "Espera nuestra confirmación por WhatsApp antes de ir a la tienda.",
    "Presenta el nombre con el que hiciste el pedido.",
    "Los pedidos confirmados se guardan durante 3 días hábiles."
  ],

  // true = el formulario pide el documento de identidad (siempre opcional)
  pedirDocumento: false,

  // Datos del responsable del tratamiento de datos (política de privacidad)
  responsable: {
    razonSocial: "Nombre o razón social del propietario",
    nit: "NIT o cédula del responsable"
  },

  // Dónde está guardada la tienda en GitHub (lo usa el panel admin.html
  // para guardar los productos). No es una contraseña.
  github: {
    usuario: "andresyairrenteriamurillo-maker",
    repositorio: "tienda-juguetes",
    rama: "main"
  },

  // Mientras sea true, se muestra el aviso de "tienda de demostración".
  // Cámbialo a false cuando cargues tus productos reales.
  modoDemo: true
};
