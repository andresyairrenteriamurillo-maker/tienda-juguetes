/* =========================================================
   CONFIGURACIÓN DE LA TIENDA
   ---------------------------------------------------------
   Lo más fácil es cambiar estos datos desde el panel:
   Administrar → Datos de la tienda. También puedes editar
   aquí lo que está entre comillas y guardar.
   ========================================================= */

window.TIENDA_CONFIG = {
  // Nombre que aparece en el encabezado, el pie de página y el mensaje de WhatsApp
  nombre: "CACHARRERIA ORO-COPIAS",

  // Frase corta debajo del nombre
  eslogan: "Juguetes que alegran el día",

  // WhatsApp en formato internacional: 57 + 10 dígitos, sin espacios ni "+"
  whatsapp: "573134173628",

  // Cómo se muestra el teléfono en la página
  telefonoVisible: "313 417 3628",

  // Correo de contacto (pie de página y política de datos)
  correo: "contacto@tutienda.com",

  // Dirección donde los clientes recogen sus pedidos
  direccion: "Calle 00 # 00-00, Barrio Ejemplo",
  ciudad: "Florencia-Caquetá, Colombia",

  // Enlace de Google Maps (opcional). "" si no tienes.
  mapaUrl: "https://currentlocation.org/es/u#1.63069,-75.60483",

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

  // Dónde está guardada la tienda en GitHub (lo usa el panel). No es una contraseña.
  github: {
    usuario: "andresyairrenteriamurillo-maker",
    repositorio: "tienda-juguetes",
    rama: "main"
  },

  // true = muestra el aviso de "tienda de demostración"
  modoDemo: true
};
