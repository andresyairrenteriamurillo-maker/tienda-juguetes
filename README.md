# Tienda de juguetes con pedidos por WhatsApp

Página web sencilla: los clientes ven el catálogo, arman su carrito y envían el pedido a tu WhatsApp. No hay registro de usuarios, pagos en línea ni domicilios. Todos los pedidos se **recogen en la tienda**.

Son archivos HTML, CSS y JavaScript sencillos. **No hay que instalar nada ni compilar nada**: subes la carpeta a GitHub y la página funciona.

## Archivos

```
index.html          → la tienda
privacidad.html     → política de tratamiento de datos (Colombia)
css/estilos.css     → colores y diseño
js/config.js        → ✏️ DATOS DE TU TIENDA (nombre, WhatsApp, dirección, horarios)
js/productos.js     → ✏️ TUS PRODUCTOS Y CATEGORÍAS
js/pedido.js        → cálculos y mensaje de WhatsApp (no tocar)
js/app.js           → funcionamiento del carrito y la página (no tocar)
img/productos/      → aquí van las fotos de tus juguetes
.nojekyll           → archivo vacío que necesita GitHub Pages (no borrar)
```

## Publicar en GitHub Pages (gratis)

1. Entra a [github.com](https://github.com) y crea una cuenta, si no tienes una.
2. Pulsa **New repository** (botón verde «New»).
   - Ponle un nombre, por ejemplo `tienda-juguetes`.
   - Márcalo como **Public**. GitHub Pages gratis necesita repositorios públicos. No hay problema, porque el proyecto no tiene contraseñas ni datos privados.
   - Pulsa **Create repository**.
3. En el repositorio nuevo, pulsa **uploading an existing file** (o **Add file → Upload files**).
4. Abre la carpeta `tienda-juguetes` en tu computador y **arrastra TODO su contenido**: `index.html`, `privacidad.html`, `README.md`, `.nojekyll` y las carpetas `css`, `js` e `img`. No arrastres la carpeta misma, solo lo que hay adentro.
   > Si `.nojekyll` no se ve, es porque los archivos que empiezan con punto están ocultos. Puedes saltarlo: la página funciona igual.
5. Escribe abajo un mensaje como «Primera versión» y pulsa **Commit changes**.
6. Ve a **Settings → Pages**.
   - En *Source* elige **Deploy from a branch**.
   - En *Branch* elige **main** y la carpeta **/ (root)**.
   - Pulsa **Save**.
7. Espera 1 o 2 minutos y recarga. Arriba aparecerá la dirección de tu tienda, por ejemplo:
   `https://TU-USUARIO.github.io/tienda-juguetes/`

Esa es la dirección que compartes con tus clientes. Funciona en celulares y computadores.

## Subir productos desde el panel (recomendado)

La tienda tiene un panel para agregar, editar y borrar productos con foto, desde el celular o el computador:

**https://andresyairrenteriamurillo-maker.github.io/tienda-juguetes/admin.html**

(También está el enlace «Administrar» al final de la tienda.)

La primera vez el panel te pide una **llave de acceso de GitHub**. El mismo panel explica cómo crearla. En resumen:

1. Abre https://github.com/settings/personal-access-tokens/new
2. Nombre: «Panel tienda». Vencimiento: el que quieras.
3. *Repository access* → **Only select repositories** → `tienda-juguetes`.
4. *Permissions* → *Repository permissions* → **Contents: Read and write**.
5. **Generate token**, copia la llave (`github_pat_...`) y pégala en el panel.

La llave solo funciona para esta tienda y queda guardada únicamente en tu dispositivo. Nunca la compartas ni la escribas en ningún archivo. Si pierdes el celular, bórrala en GitHub (*Settings → Developer settings → Personal access tokens*) y crea otra.

Cada vez que guardas, el panel sube la foto (reducida para que cargue rápido) a `img/productos/` y actualiza `js/productos.js`. La tienda se actualiza en unos minutos.

## Cambiar datos a mano desde GitHub

No necesitas programas. Desde la página de tu repositorio:

1. Abre el archivo, por ejemplo `js/config.js`.
2. Pulsa el ícono del **lápiz ✏️** (Edit).
3. Cambia lo que necesites y pulsa **Commit changes**.
4. En 1 o 2 minutos la página se actualiza sola. Si no ves el cambio, recarga con Ctrl + F5 o abre la página en una ventana de incógnito.

### Agregar un producto

En `js/productos.js`, copia una línea completa de producto, pégala debajo y cámbiale los datos:

```js
{ id: "J001", nombre: "Carro de bomberos", descripcion: "Con luces y sonido.", precio: 55000, precioPromo: null, imagen: "img/productos/J001.jpg", categoria: "vehiculos", stock: 5, activo: true, destacado: false, fechaCreacion: "2026-11-01", demo: false },
```

- **id** distinto para cada producto.
- **precio** sin puntos: `55000`, no `55.000`.
- **precioPromo**: el precio rebajado, o `null` si no tiene promoción.
- **stock**: unidades disponibles. Con `0` aparece como «Agotado» y no se puede agregar al carrito. Si no llevas inventario, pon `null`.
- **activo: false** oculta el producto sin borrarlo.
- **demo: false** quita la etiqueta «EJEMPLO».
- Cuida las comas: cada producto termina en `},`.

### Subir fotos

1. Entra a la carpeta `img/productos` del repositorio.
2. Pulsa **Add file → Upload files** y sube la foto (por ejemplo `J001.jpg`).
3. En el producto escribe `imagen: "img/productos/J001.jpg"`. Respeta mayúsculas y minúsculas.

Recomendación: fotos cuadradas o 4:3, de menos de 300 KB, para que la página cargue rápido. Si un producto no tiene foto, se muestra un dibujo de su categoría.

## ✅ Lista de cosas que debes cambiar antes de abrir la tienda

En **`js/config.js`**:
- [ ] `nombre`: el nombre real de tu tienda.
- [ ] `eslogan`.
- [ ] `whatsapp`: tu número con 57 adelante, sin espacios ni «+». Ej.: `573101234567`. **Es lo más importante.**
- [ ] `telefonoVisible`.
- [ ] `correo`.
- [ ] `direccion` y `ciudad`.
- [ ] `mapaUrl`: el enlace de Google Maps (opcional).
- [ ] `horarios`.
- [ ] `instruccionesRecogida`.
- [ ] `pedirDocumento`: `true` solo si de verdad necesitas la cédula.
- [ ] `responsable`: tu nombre o razón social y tu NIT o cédula, para la política de datos.
- [ ] `modoDemo: false`, para quitar el aviso amarillo de demostración.

En **`js/productos.js`**:
- [ ] Borra los productos `DEMO-01` a `DEMO-17` y agrega los tuyos con `demo: false`.
- [ ] Revisa que los precios y existencias sean correctos.

En **`index.html`** (opcional, para Google):
- [ ] Cambia el texto de las etiquetas `<title>` y `<meta name="description">` en las primeras líneas.

En **`privacidad.html`**:
- [ ] Revisa el texto, idealmente con un asesor legal, y actualiza la fecha.

Al final, **haz un pedido de prueba desde tu celular** y verifica que el mensaje llegue a tu WhatsApp.

## Cómo funciona un pedido

1. El cliente agrega juguetes al carrito. El carrito se guarda en su navegador, sin datos personales.
2. Pulsa **Finalizar pedido**. Escribe su nombre y celular, elige transferencia o efectivo y acepta la política de datos.
3. Pulsa **Enviar pedido por WhatsApp**. Se abre WhatsApp con el pedido ya escrito y dirigido a tu número.
4. El cliente pulsa **Enviar** dentro de WhatsApp. Solo en ese momento recibes el pedido.
5. Tú confirmas la disponibilidad y, si es por transferencia, le compartes los datos bancarios por el chat.

La página nunca dice que el pedido está confirmado o pagado. Eso lo haces tú por WhatsApp.

## Probar en tu computador (opcional)

Haz doble clic en `index.html` y se abre en el navegador. Todo funciona sin conexión, excepto las fuentes tipográficas y el envío a WhatsApp.

## ¿Y un panel de administración?

Para que esto siga siendo simple, los productos se editan en `js/productos.js` directamente en GitHub. Un panel con usuario y contraseña necesitaría un servicio externo con base de datos, como Supabase o Firebase. Se puede agregar más adelante si el catálogo crece mucho.
