/* =========================================================
   CATÁLOGO DE PRODUCTOS
   ---------------------------------------------------------
   Este archivo lo actualiza el panel de productos (admin.html).
   También puedes editarlo a mano con cuidado.

   Campos de cada producto:
   - id, nombre, descripcion
   - precio y precioPromo (en pesos, sin puntos; precioPromo puede ser null)
   - imagen: ruta de la foto (o "" para un dibujo provisional)
   - categoria: una de las claves de CATEGORIAS
   - stock: unidades disponibles (null = no se lleva inventario, 0 = agotado)
   - activo, destacado, fechaCreacion (AAAA-MM-DD), demo
   ========================================================= */

window.CATEGORIAS = [
  {"clave":"vehiculos","nombre":"Carros y vehículos","emoji":"🚗","color":"#3B82F6"},
  {"clave":"munecas","nombre":"Muñecas","emoji":"🎀","color":"#EC4899"},
  {"clave":"construccion","nombre":"Juegos de construcción","emoji":"🧱","color":"#F97316"},
  {"clave":"mesa","nombre":"Juegos de mesa","emoji":"🎲","color":"#8B5CF6"},
  {"clave":"educativos","nombre":"Juguetes educativos","emoji":"🔤","color":"#10B981"},
  {"clave":"peluches","nombre":"Peluches","emoji":"🧸","color":"#D97706"},
  {"clave":"bebes","nombre":"Juguetes para bebés","emoji":"🍼","color":"#06B6D4"},
  {"clave":"accion","nombre":"Figuras de acción","emoji":"🦸","color":"#EF4444"},
  {"clave":"electronicos","nombre":"Juguetes electrónicos","emoji":"🤖","color":"#6366F1"},
  {"clave":"airelibre","nombre":"Aire libre y deportes","emoji":"⚽","color":"#22C55E"},
  {"clave":"manualidades","nombre":"Manualidades","emoji":"🎨","color":"#F43F5E"}
];

window.PRODUCTOS = [
  {"id":"DEMO-04","nombre":"Muñeca Lovely Girl Fashion con Vestidos","descripcion":"Muñeca de moda con blusa de colores y falda amarilla brillante. Trae 2 vestidos adicionales y un bolso para cambiarle el look. Ideal para regalo. Para niñas desde 3 años.","precio":8000,"precioPromo":null,"imagen":"img/productos/demo-04-mw8195ps.jpg","categoria":"munecas","stock":200,"activo":true,"destacado":false,"fechaCreacion":"2026-10-20","demo":false},
  {"id":"DEMO-10","nombre":"MUÑECA BARBIE MILU DOLLS","descripcion":"Muñeca mili dolls, muñeca de moda","precio":5000,"precioPromo":null,"imagen":"img/productos/demo-10-mw80ifzh.jpg","categoria":"munecas","stock":300,"activo":true,"destacado":true,"fechaCreacion":"2026-10-25","demo":false},
  {"id":"DEMO-14","nombre":"Muñeca Beautiful Princesa con Accesorios","descripcion":"Muñeca de moda con vestido elegante rosado, tiara y cabello largo. Incluye cepillo, espejo y vestido extra de lunares para cambiarle el look. Ideal para regalo. Para niñas desde 3 años.","precio":8000,"precioPromo":null,"imagen":"img/productos/demo-14-mw80ycmc.jpg","categoria":"munecas","stock":288,"activo":true,"destacado":true,"fechaCreacion":"2026-10-22","demo":false},
  {"id":"J001","nombre":"CAMION VOLQUETA","descripcion":"Camión volqueta – Carga y descarga.","precio":7000,"precioPromo":null,"imagen":"img/productos/j001-mw823uql.jpg","categoria":"vehiculos","stock":400,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J002","nombre":"CARRO DEPORTIVO","descripcion":"Carro deportivo – Velocidad extrema.","precio":5000,"precioPromo":null,"imagen":"img/productos/j002-mw825qua.jpg","categoria":"vehiculos","stock":300,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J003","nombre":"AVION ROMPECABEZAS","descripcion":"Avión rompecabezas – Arma, juega","precio":8000,"precioPromo":null,"imagen":"img/productos/j003-mw827e6w.jpg","categoria":"vehiculos","stock":25,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J004","nombre":"EXCAVADORA","descripcion":"Excavadora – Pequeño constructor.","precio":5000,"precioPromo":null,"imagen":"img/productos/j004-mw82awuw.jpg","categoria":"vehiculos","stock":300,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J005","nombre":"RACING SPORT – Set de 6 Carritos Deportivos","descripcion":"Vive la emoción de las carreras! Seis carritos deportivos de diferentes colores, con diseños llamativos, ideales para competencias, juegos de velocidad y diversión infantil. Características: - Incluye 6 carritos deportivos. - Diferentes col","precio":5000,"precioPromo":null,"imagen":"img/productos/j005-mw82sha4.jpg","categoria":"vehiculos","stock":200,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J006","nombre":"SONAJERO CUBO SENSORIAL","descripcion":"Descripción: Juguete sensorial de colores llamativos, diseñado para estimular los sentidos del bebé mediante la exploración visual, táctil y el sonido. Características: - Diseño de cubo multicolor. - Formas y texturas para explorar.","precio":5000,"precioPromo":null,"imagen":"img/productos/j006-mw82xntt.jpg","categoria":"vehiculos","stock":200,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J007","nombre":"Set de Belleza Infantil – Accesorios de Peinado.","descripcion":"Set de belleza infantil con divertidos accesorios para el cabello. Ideal para que las niñas jueguen a peinarse, creen diferentes estilos y desarrollen su creatividad e imaginación. Incluye: pinzas decorativas, rulos, peineta.","precio":5000,"precioPromo":null,"imagen":"img/productos/j007-mw832xcf.jpg","categoria":"munecas","stock":200,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false},
  {"id":"J008","nombre":"Lonchera Infantil Pollito – Diseño Divertido.","descripcion":"Lonchera infantil con adorable diseño de pollito, ideal para llevar alimentos, refrigerios y bebidas al colegio, paseos o actividades recreativas. Su diseño colorido y práctico la convierte en una excelente opción para los más pequeños.","precio":6000,"precioPromo":null,"imagen":"img/productos/j008-mw83m472.jpg","categoria":"peluches","stock":200,"activo":true,"destacado":false,"fechaCreacion":"2026-11-08","demo":false}
];
