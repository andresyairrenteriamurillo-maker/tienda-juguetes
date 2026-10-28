/* =========================================================
   CATÁLOGO DE PRODUCTOS
   ---------------------------------------------------------
   ⚠️ TODOS los productos de abajo son DE DEMOSTRACIÓN.
   Reemplázalos por tus juguetes reales.

   Campos de cada producto:
   - id:            código único (sin repetir). Ej: "J001"
   - nombre:        nombre del juguete
   - descripcion:   texto corto
   - precio:        precio normal en pesos, SIN puntos. Ej: 45000
   - precioPromo:   precio en promoción (o null si no hay)
   - imagen:        ruta de la foto. Ej: "img/productos/J001.jpg"
                    Déjalo "" para mostrar un dibujo provisional.
   - categoria:     una de las claves de CATEGORIAS (más abajo)
   - stock:         unidades disponibles (número) o null si no
                    llevas inventario. 0 = agotado.
   - activo:        true = se muestra en la tienda; false = oculto
   - destacado:     true = aparece en "Productos destacados"
   - fechaCreacion: fecha en formato "AAAA-MM-DD" (para "Novedades")
   - demo:          true = se marca como producto de ejemplo
   ========================================================= */

window.CATEGORIAS = [
  { clave: "vehiculos", nombre: "Carros y vehículos", emoji: "🚗", color: "#3B82F6" },
  { clave: "munecas", nombre: "Muñecas", emoji: "🎀", color: "#EC4899" },
  { clave: "construccion", nombre: "Juegos de construcción", emoji: "🧱", color: "#F97316" },
  { clave: "mesa", nombre: "Juegos de mesa", emoji: "🎲", color: "#8B5CF6" },
  { clave: "educativos", nombre: "Juguetes educativos", emoji: "🔤", color: "#10B981" },
  { clave: "peluches", nombre: "Peluches", emoji: "🧸", color: "#D97706" },
  { clave: "bebes", nombre: "Juguetes para bebés", emoji: "🍼", color: "#06B6D4" },
  { clave: "accion", nombre: "Figuras de acción", emoji: "🦸", color: "#EF4444" },
  { clave: "electronicos", nombre: "Juguetes electrónicos", emoji: "🤖", color: "#6366F1" },
  { clave: "airelibre", nombre: "Aire libre y deportes", emoji: "⚽", color: "#22C55E" },
  { clave: "manualidades", nombre: "Manualidades", emoji: "🎨", color: "#F43F5E" }
  // "Promociones" no es una categoría fija: se muestra automáticamente
  // cualquier producto que tenga precioPromo.
];

window.PRODUCTOS = [
  { id: "DEMO-01", nombre: "Carro de carreras a fricción", descripcion: "Carro de juguete que avanza solo después de empujarlo. Ideal para carreras en casa.", precio: 35000, precioPromo: null, imagen: "", categoria: "vehiculos", stock: 8, activo: true, destacado: true, fechaCreacion: "2026-09-02", demo: true },
  { id: "DEMO-02", nombre: "Camión volqueta grande", descripcion: "Volqueta con platón que sube y baja. Plástico resistente para juego en arena.", precio: 59000, precioPromo: 49000, imagen: "", categoria: "vehiculos", stock: 4, activo: true, destacado: false, fechaCreacion: "2026-10-10", demo: true },
  { id: "DEMO-03", nombre: "Muñeca con accesorios", descripcion: "Muñeca articulada con cepillo, ropa intercambiable y accesorios.", precio: 65000, precioPromo: null, imagen: "", categoria: "munecas", stock: 6, activo: true, destacado: true, fechaCreacion: "2026-08-15", demo: true },
  { id: "DEMO-04", nombre: "Casa de muñecas de madera", descripcion: "Casa de dos pisos con muebles incluidos. Requiere armado sencillo.", precio: 189000, precioPromo: 159000, imagen: "", categoria: "munecas", stock: 2, activo: true, destacado: false, fechaCreacion: "2026-10-20", demo: true },
  { id: "DEMO-05", nombre: "Bloques de construcción x120", descripcion: "Caja con 120 bloques de colores compatibles entre sí para crear sin límites.", precio: 79000, precioPromo: null, imagen: "", categoria: "construccion", stock: 10, activo: true, destacado: true, fechaCreacion: "2026-07-30", demo: true },
  { id: "DEMO-06", nombre: "Juego de mesa familiar", descripcion: "Juego de estrategia por turnos para 2 a 6 jugadores desde los 7 años.", precio: 52000, precioPromo: null, imagen: "", categoria: "mesa", stock: 5, activo: true, destacado: false, fechaCreacion: "2026-06-12", demo: true },
  { id: "DEMO-07", nombre: "Rompecabezas 500 piezas", descripcion: "Rompecabezas de paisaje colombiano. Piezas gruesas de buena calidad.", precio: 38000, precioPromo: 29000, imagen: "", categoria: "mesa", stock: 0, activo: true, destacado: false, fechaCreacion: "2026-05-04", demo: true },
  { id: "DEMO-08", nombre: "Ábaco de madera", descripcion: "Ábaco de colores para aprender a contar, sumar y restar jugando.", precio: 28000, precioPromo: null, imagen: "", categoria: "educativos", stock: 12, activo: true, destacado: false, fechaCreacion: "2026-09-18", demo: true },
  { id: "DEMO-09", nombre: "Tablero de letras magnéticas", descripcion: "Tablero con letras y números imantados para practicar lectura y escritura.", precio: 45000, precioPromo: null, imagen: "", categoria: "educativos", stock: 7, activo: true, destacado: true, fechaCreacion: "2026-10-01", demo: true },
  { id: "DEMO-10", nombre: "Oso de peluche 40 cm", descripcion: "Oso suave y abrazable, con lazo de tela. Lavable a mano.", precio: 48000, precioPromo: 39000, imagen: "", categoria: "peluches", stock: 9, activo: true, destacado: true, fechaCreacion: "2026-10-25", demo: true },
  { id: "DEMO-11", nombre: "Sonajero musical", descripcion: "Sonajero con luces suaves y melodías. Recomendado desde los 6 meses.", precio: 25000, precioPromo: null, imagen: "", categoria: "bebes", stock: 15, activo: true, destacado: false, fechaCreacion: "2026-08-03", demo: true },
  { id: "DEMO-12", nombre: "Gimnasio de actividades para bebé", descripcion: "Tapete acolchado con arco y juguetes colgantes para estimular al bebé.", precio: 135000, precioPromo: null, imagen: "", categoria: "bebes", stock: 3, activo: true, destacado: false, fechaCreacion: "2026-10-14", demo: true },
  { id: "DEMO-13", nombre: "Figura de superhéroe articulada", descripcion: "Figura de 30 cm con articulaciones móviles y capa de tela.", precio: 42000, precioPromo: null, imagen: "", categoria: "accion", stock: 0, activo: true, destacado: false, fechaCreacion: "2026-07-11", demo: true },
  { id: "DEMO-14", nombre: "Robot programable", descripcion: "Robot que sigue líneas y responde a comandos sencillos. Funciona con pilas AA.", precio: 210000, precioPromo: 185000, imagen: "", categoria: "electronicos", stock: 2, activo: true, destacado: true, fechaCreacion: "2026-10-22", demo: true },
  { id: "DEMO-15", nombre: "Balón de fútbol N.º 4", descripcion: "Balón cosido a máquina, tamaño infantil, para jugar en cancha o parque.", precio: 39000, precioPromo: null, imagen: "", categoria: "airelibre", stock: 11, activo: true, destacado: false, fechaCreacion: "2026-09-25", demo: true },
  { id: "DEMO-16", nombre: "Kit de pintura y plastilina", descripcion: "Témperas, pinceles, plastilina y moldes para crear en familia.", precio: 33000, precioPromo: null, imagen: "", categoria: "manualidades", stock: 6, activo: true, destacado: false, fechaCreacion: "2026-10-05", demo: true },
  { id: "DEMO-17", nombre: "Producto inactivo (no se muestra)", descripcion: "Ejemplo de producto oculto con activo: false.", precio: 10000, precioPromo: null, imagen: "", categoria: "manualidades", stock: 1, activo: false, destacado: false, fechaCreacion: "2026-01-01", demo: true }
];
