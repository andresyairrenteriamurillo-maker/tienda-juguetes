/* =========================================================
   FUNCIONAMIENTO DE LA TIENDA (catálogo, carrito y pedido)
   No necesitas editar este archivo.
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.TIENDA_CONFIG;
  var P = window.Pedido;
  var CATS = window.CATEGORIAS;
  var CLAVE_CARRITO = "carrito_juguetes_v1"; // solo guarda { id: cantidad }, nunca datos personales

  var productos = window.PRODUCTOS.filter(function (p) { return p.activo; });
  var porId = {};
  productos.forEach(function (p) { porId[p.id] = p; });
  var catPorClave = {};
  CATS.forEach(function (c) { catPorClave[c.clave] = c; });

  /* ---------- Utilidades ---------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Iconos (trazos basados en Lucide, licencia ISC)
  var ICONOS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
  };
  function icono(nombre) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONOS[nombre] || "") + "</svg>";
  }
  function pintarIconos(ctx) {
    $$("[data-icon]", ctx).forEach(function (el) { el.innerHTML = icono(el.getAttribute("data-icon")); });
  }

  var toastTimer;
  function aviso(texto) {
    var t = $("#toast");
    t.textContent = texto;
    t.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("toast--visible"); }, 2600);
  }

  /* ---------- Configuración en la página ---------- */
  function aplicarConfig() {
    $$("[data-config]").forEach(function (el) {
      var v = CFG[el.getAttribute("data-config")];
      if (typeof v === "string") el.textContent = v;
    });
    document.title = CFG.nombre + " | Catálogo de juguetes con pedidos por WhatsApp";
    $("#aviso-demo").hidden = !CFG.modoDemo;
    $("#anio").textContent = new Date().getFullYear();

    var consulta = P.construirEnlaceWhatsApp(CFG.whatsapp, "Hola, " + CFG.nombre + ". Tengo una consulta sobre sus juguetes.");
    $$(".enlace-wa-consulta, .enlace-wa-texto").forEach(function (a) { a.href = consulta; });
    $("#enlace-correo").href = "mailto:" + CFG.correo;
    if (CFG.mapaUrl) { $("#enlace-mapa").href = CFG.mapaUrl; $("#enlace-mapa").hidden = false; }

    var horarios = CFG.horarios.map(function (h) {
      return "<li><span>" + esc(h.dias) + "</span><strong>" + esc(h.horas) + "</strong></li>";
    }).join("");
    $("#horarios").innerHTML = horarios;
    $("#horarios-pedido").innerHTML = horarios;
    $("#instrucciones").innerHTML = CFG.instruccionesRecogida.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    $("#campo-documento").hidden = !CFG.pedirDocumento;
  }

  /* ---------- Tarjetas de producto ---------- */
  function etiquetaDisponibilidad(p) {
    if (!P.estaDisponible(p)) return '<span class="disp disp--no">Agotado</span>';
    if (p.stock != null && p.stock <= 3) return '<span class="disp disp--pocas">Últimas unidades</span>';
    return '<span class="disp disp--si">Disponible</span>';
  }

  function bloquePrecio(p) {
    var final = P.precioFinal(p);
    if (final < p.precio) {
      return '<p class="precio"><span class="precio__antes">' + P.formatearCOP(p.precio) + '</span> <span class="precio__ahora">' + P.formatearCOP(final, true) + "</span></p>";
    }
    return '<p class="precio"><span class="precio__ahora">' + P.formatearCOP(final, true) + "</span></p>";
  }

  function imagenProducto(p, clase) {
    var cat = catPorClave[p.categoria] || { emoji: "🎁", color: "#8B5CF6" };
    var fondo = 'style="--c:' + esc(cat.color) + '"';
    if (p.imagen) {
      return '<div class="' + clase + '" ' + fondo + '><img src="' + esc(p.imagen) + '" alt="' + esc(p.nombre) + '" loading="lazy" decoding="async" onerror="this.remove()"><span class="foto__emoji" aria-hidden="true">' + cat.emoji + "</span></div>";
    }
    return '<div class="' + clase + '" ' + fondo + ' role="img" aria-label="Imagen provisional de ' + esc(p.nombre) + '"><span class="foto__emoji">' + cat.emoji + "</span></div>";
  }

  function tarjeta(p) {
    var disponible = P.estaDisponible(p);
    var promo = P.precioFinal(p) < p.precio;
    return '<article class="producto' + (disponible ? "" : " producto--agotado") + '">' +
      '<button class="producto__media" data-detalle="' + esc(p.id) + '" aria-label="Ver detalles de ' + esc(p.nombre) + '">' + imagenProducto(p, "foto") +
        (p.demo ? '<span class="sello sello--demo">Ejemplo</span>' : "") +
        (promo ? '<span class="sello sello--promo">Promo</span>' : "") +
        (!disponible ? '<span class="sello sello--agotado">Agotado</span>' : "") +
      "</button>" +
      '<div class="producto__cuerpo">' +
        '<h3 class="producto__nombre"><button class="link-detalle" data-detalle="' + esc(p.id) + '">' + esc(p.nombre) + "</button></h3>" +
        bloquePrecio(p) +
        '<button class="btn btn--agregar" data-agregar="' + esc(p.id) + '"' + (disponible ? "" : " disabled") + ' aria-label="Agregar ' + esc(p.nombre) + ' al carrito">' +
          (disponible ? icono("plus") + " Agregar" : "Agotado") + "</button>" +
      "</div></article>";
  }

  function pintarLista(sel, lista, vacio) {
    $(sel).innerHTML = lista.length ? lista.map(tarjeta).join("") : '<p class="vacio">' + esc(vacio || "No hay productos para mostrar.") + "</p>";
  }

  /* ---------- Catálogo ---------- */
  var categoriaActiva = "";

  function pintarChips() {
    var hayPromos = productos.some(function (p) { return P.precioFinal(p) < p.precio; });
    var chips = [{ clave: "", nombre: "Todos", emoji: "✨" }];
    if (hayPromos) chips.push({ clave: "__promo", nombre: "Promociones", emoji: "🏷️" });
    CATS.forEach(function (c) {
      if (productos.some(function (p) { return p.categoria === c.clave; })) chips.push(c);
    });
    $("#chips").innerHTML = chips.map(function (c) {
      var activo = c.clave === categoriaActiva;
      return '<button class="chip' + (activo ? " chip--activo" : "") + '" data-categoria="' + esc(c.clave) + '" aria-pressed="' + activo + '">' +
        '<span aria-hidden="true">' + c.emoji + "</span> " + esc(c.nombre) + "</button>";
    }).join("");
  }

  function normalizar(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function aplicarFiltros() {
    var q = normalizar($("#buscar").value.trim());
    var orden = $("#orden").value;

    var lista = productos.filter(function (p) {
      if (categoriaActiva === "__promo" && P.precioFinal(p) >= p.precio) return false;
      if (categoriaActiva && categoriaActiva !== "__promo" && p.categoria !== categoriaActiva) return false;
      if (q) {
        var cn = catPorClave[p.categoria] ? catPorClave[p.categoria].nombre : "";
        if (normalizar(p.nombre + " " + p.descripcion + " " + cn).indexOf(q) === -1) return false;
      }
      return true;
    });

    lista.sort(function (a, b) {
      // Los agotados siempre van al final
      var da = P.estaDisponible(a) ? 0 : 1, db = P.estaDisponible(b) ? 0 : 1;
      if (da !== db) return da - db;
      if (orden === "menor") return P.precioFinal(a) - P.precioFinal(b);
      if (orden === "mayor") return P.precioFinal(b) - P.precioFinal(a);
      if (orden === "recomendados" && a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return b.fechaCreacion.localeCompare(a.fechaCreacion);
    });

    pintarLista("#lista-catalogo", lista, "No encontramos juguetes con esa búsqueda. Prueba otra palabra o elige «Todos».");
    $("#resultado").textContent = lista.length + (lista.length === 1 ? " juguete" : " juguetes");
  }

  /* ---------- Carrito ---------- */
  var carrito = cargarCarrito();

  function cargarCarrito() {
    try {
      var datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "{}");
      var limpio = {};
      Object.keys(datos).forEach(function (id) {
        var p = porId[id];
        var n = parseInt(datos[id], 10);
        if (p && P.estaDisponible(p) && n > 0) limpio[id] = Math.min(n, P.maximoUnidades(p));
      });
      return limpio;
    } catch (e) { return {}; }
  }

  function guardarCarrito() {
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) { /* almacenamiento no disponible */ }
  }

  function itemsCarrito() {
    return Object.keys(carrito).map(function (id) { return { producto: porId[id], cantidad: carrito[id] }; });
  }

  function agregar(id, cantidad) {
    var p = porId[id];
    if (!p || !P.estaDisponible(p)) { aviso("Este producto no está disponible."); return false; }
    var actual = carrito[id] || 0;
    var maximo = P.maximoUnidades(p);
    if (actual >= maximo) { aviso("Ya tienes todas las unidades disponibles de este producto."); return false; }
    carrito[id] = Math.min(maximo, actual + (cantidad || 1));
    guardarCarrito();
    actualizarCarrito(true);
    aviso("Agregaste «" + p.nombre + "» al carrito");
    return true;
  }

  function cambiarCantidad(id, delta) {
    var p = porId[id];
    if (!p || !carrito[id]) return;
    var nuevo = carrito[id] + delta;
    if (nuevo <= 0) { delete carrito[id]; }
    else if (nuevo > P.maximoUnidades(p)) { aviso("No hay más unidades disponibles."); return; }
    else carrito[id] = nuevo;
    guardarCarrito();
    actualizarCarrito();
  }

  function quitar(id) { delete carrito[id]; guardarCarrito(); actualizarCarrito(); }

  function vaciar() { carrito = {}; guardarCarrito(); actualizarCarrito(); }

  function actualizarCarrito(animar) {
    var items = itemsCarrito();
    var t = P.calcularTotales(items);
    var contador = $("#contador-carrito");
    contador.textContent = t.unidades;
    contador.classList.toggle("contador--vacio", t.unidades === 0);
    if (animar) {
      contador.classList.remove("rebote"); void contador.offsetWidth; contador.classList.add("rebote");
    }

    if (!items.length) {
      $("#carrito-lista").innerHTML = '<div class="vacio vacio--carrito"><span aria-hidden="true">🛒</span><p>Tu carrito está vacío.</p><button class="btn btn--primario" data-cerrar>Explorar juguetes</button></div>';
      $("#carrito-pie").hidden = true;
    } else {
      $("#carrito-pie").hidden = false;
      $("#carrito-lista").innerHTML = t.lineas.map(function (l) {
        var p = l.producto;
        return '<div class="linea">' + imagenProducto(p, "linea__foto") +
          '<div class="linea__info"><p class="linea__nombre">' + esc(p.nombre) + (p.demo ? ' <span class="mini-demo">ejemplo</span>' : "") + "</p>" +
          '<p class="linea__unit">' + P.formatearCOP(l.unitario) + " c/u</p>" +
          '<div class="cantidad" role="group" aria-label="Cantidad de ' + esc(p.nombre) + '">' +
            '<button class="btn-icono" data-menos="' + esc(p.id) + '" aria-label="Disminuir">' + icono("minus") + "</button>" +
            '<span aria-live="polite">' + l.cantidad + "</span>" +
            '<button class="btn-icono" data-mas="' + esc(p.id) + '" aria-label="Aumentar"' + (l.cantidad >= P.maximoUnidades(p) ? " disabled" : "") + ">" + icono("plus") + "</button>" +
          "</div></div>" +
          '<div class="linea__fin"><strong>' + P.formatearCOP(l.subtotal) + "</strong>" +
          '<button class="btn-icono btn--peligro" data-quitar="' + esc(p.id) + '" aria-label="Eliminar ' + esc(p.nombre) + '">' + icono("trash") + "</button></div></div>";
      }).join("");
      $("#carrito-total").textContent = P.formatearCOP(t.total, true);
    }
  }

  /* ---------- Detalle de producto ---------- */
  function abrirDetalle(id) {
    var p = porId[id];
    if (!p) return;
    var cat = catPorClave[p.categoria];
    var disponible = P.estaDisponible(p);
    $("#detalle-contenido").innerHTML =
      '<div class="dialogo__cabecera"><h2 id="detalle-titulo">' + esc(p.nombre) + '</h2><button class="btn-icono" data-cerrar aria-label="Cerrar">' + icono("x") + "</button></div>" +
      '<div class="detalle">' +
        '<div class="detalle__media">' + imagenProducto(p, "foto foto--grande") + (p.demo ? '<span class="sello sello--demo">Ejemplo</span>' : "") + "</div>" +
        '<div class="detalle__info">' +
          '<p class="producto__cat">' + esc(cat ? cat.nombre : "") + " · Ref. " + esc(p.id) + "</p>" +
          "<p>" + esc(p.descripcion) + "</p>" +
          (p.demo ? '<p class="nota">Este es un producto de demostración: no está a la venta.</p>' : "") +
          bloquePrecio(p) + etiquetaDisponibilidad(p) +
          '<p class="nota">Recogida en tienda. Disponibilidad sujeta a confirmación.</p>' +
          '<button class="btn btn--primario btn--bloque" data-agregar="' + esc(p.id) + '"' + (disponible ? "" : " disabled") + ">" + icono("cart") + (disponible ? " Agregar al carrito" : " Agotado") + "</button>" +
        "</div></div>";
    abrir($("#dlg-detalle"));
  }

  /* ---------- Diálogos ---------- */
  function abrir(dlg) { if (!dlg.open) dlg.showModal(); }
  function cerrar(dlg) { if (dlg.open) dlg.close(); }

  /* ---------- Formulario de pedido ---------- */
  var enlaceActual = "";

  function marcarEstado(n) {
    $$("#estados li").forEach(function (li) {
      var e = parseInt(li.getAttribute("data-estado"), 10);
      li.classList.toggle("hecho", e < n);
      li.classList.toggle("actual", e === n);
      if (e === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function leerFormulario() {
    var f = $("#form-pedido");
    var pago = f.querySelector('input[name="metodoPago"]:checked');
    return {
      nombre: f.nombre.value, celular: f.celular.value,
      documento: CFG.pedirDocumento ? f.documento.value : "",
      observaciones: f.observaciones.value,
      metodoPago: pago ? pago.value : "",
      aceptaDatos: f.aceptaDatos.checked
    };
  }

  function mostrarErrores(errores) {
    ["nombre", "celular", "documento", "metodoPago", "aceptaDatos"].forEach(function (k) {
      var el = $("#e-" + k);
      if (el) el.textContent = errores[k] || "";
      var input = { nombre: "#c-nombre", celular: "#c-celular", documento: "#c-documento", aceptaDatos: "#c-acepta" }[k];
      if (input) $(input).setAttribute("aria-invalid", errores[k] ? "true" : "false");
    });
  }

  function pintarResumen() {
    var t = P.calcularTotales(itemsCarrito());
    $("#resumen").innerHTML = '<ul class="resumen">' +
      t.lineas.map(function (l) {
        return '<li><div><strong>' + esc(l.producto.nombre) + "</strong><span>" + l.cantidad + " × " + P.formatearCOP(l.unitario) + "</span></div><b>" + P.formatearCOP(l.subtotal) + "</b></li>";
      }).join("") +
      '</ul><div class="total-fila"><span>Total</span><strong>' + P.formatearCOP(t.total, true) + "</strong></div>";
  }

  function revisarListo() {
    var errores = P.validarDatos(leerFormulario(), CFG);
    // Borra los mensajes de error de los campos que ya se corrigieron
    ["nombre", "celular", "documento", "metodoPago", "aceptaDatos"].forEach(function (k) {
      var el = $("#e-" + k);
      if (el && el.textContent && !errores[k]) {
        el.textContent = "";
        var input = { nombre: "#c-nombre", celular: "#c-celular", documento: "#c-documento", aceptaDatos: "#c-acepta" }[k];
        if (input) $(input).setAttribute("aria-invalid", "false");
      }
    });
    marcarEstado(Object.keys(errores).length ? 1 : 2);
  }

  function abrirPedido() {
    if (!Object.keys(carrito).length) { aviso("Tu carrito está vacío."); return; }
    cerrar($("#dlg-carrito"));
    $("#form-pedido").hidden = false;
    $("#post-envio").hidden = true;
    mostrarErrores({});
    pintarResumen();
    revisarListo();
    abrir($("#dlg-pedido"));
  }

  function enviarPedido(ev) {
    ev.preventDefault();
    var datos = leerFormulario();
    var errores = P.validarDatos(datos, CFG);
    mostrarErrores(errores);
    var claves = Object.keys(errores);
    if (claves.length) {
      marcarEstado(1);
      var primero = { nombre: "#c-nombre", celular: "#c-celular", documento: "#c-documento", metodoPago: 'input[name="metodoPago"]', aceptaDatos: "#c-acepta" }[claves[0]];
      var el = $(primero);
      if (el) { el.focus(); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
      return;
    }
    var items = itemsCarrito();
    if (!items.length) { aviso("Tu carrito está vacío."); return; }

    var mensaje = P.construirMensaje(datos, items, CFG);
    enlaceActual = P.construirEnlaceWhatsApp(CFG.whatsapp, mensaje);
    window.open(enlaceActual, "_blank", "noopener");

    $("#enlace-reintentar").href = enlaceActual;
    $("#form-pedido").hidden = true;
    $("#post-envio").hidden = false;
    $("#post-envio").focus();
    marcarEstado(3);
  }

  /* ---------- Eventos ---------- */
  function eventos() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("button, a");
      if (!b) return;
      if (b.hasAttribute("data-agregar")) {
        if (agregar(b.getAttribute("data-agregar"))) {
          b.classList.remove("btn--pulso"); void b.offsetWidth; b.classList.add("btn--pulso");
        }
      } else if (b.hasAttribute("data-detalle")) abrirDetalle(b.getAttribute("data-detalle"));
      else if (b.hasAttribute("data-mas")) cambiarCantidad(b.getAttribute("data-mas"), 1);
      else if (b.hasAttribute("data-menos")) cambiarCantidad(b.getAttribute("data-menos"), -1);
      else if (b.hasAttribute("data-quitar")) quitar(b.getAttribute("data-quitar"));
      else if (b.hasAttribute("data-cerrar")) cerrar(b.closest("dialog"));
      else if (b.hasAttribute("data-categoria")) {
        categoriaActiva = b.getAttribute("data-categoria");
        pintarChips(); aplicarFiltros();
      }
    });

    // Cerrar diálogos al tocar fuera
    $$("dialog").forEach(function (d) {
      d.addEventListener("click", function (e) { if (e.target === d) cerrar(d); });
    });

    $("#abrir-carrito").addEventListener("click", function () { actualizarCarrito(); abrir($("#dlg-carrito")); });
    $("#btn-finalizar").addEventListener("click", abrirPedido);
    $("#btn-vaciar").addEventListener("click", function () {
      if (window.confirm("¿Seguro que quieres vaciar el carrito?")) { vaciar(); aviso("Carrito vacío"); }
    });

    $("#buscar").addEventListener("input", aplicarFiltros);
    $("#form-buscar").addEventListener("submit", function (e) { e.preventDefault(); aplicarFiltros(); $("#buscar").blur(); });
    $("#orden").addEventListener("change", aplicarFiltros);

    var form = $("#form-pedido");
    form.addEventListener("submit", enviarPedido);
    form.addEventListener("input", revisarListo);
    form.addEventListener("change", revisarListo);

    $("#btn-volver-form").addEventListener("click", function () {
      $("#post-envio").hidden = true; form.hidden = false; revisarListo();
    });
    $("#btn-ya-envie").addEventListener("click", function () {
      vaciar();
      form.reset();
      cerrar($("#dlg-pedido"));
      aviso("¡Gracias! Tu pedido está pendiente de confirmación de la tienda por WhatsApp.");
    });

    // Si el carrito cambia en otra pestaña
    window.addEventListener("storage", function (e) { if (e.key === CLAVE_CARRITO) { carrito = cargarCarrito(); actualizarCarrito(); } });
  }

  /* ---------- Inicio ---------- */
  aplicarConfig();
  pintarIconos(document);
  pintarChips();
  aplicarFiltros();
  actualizarCarrito();
  eventos();
})();
