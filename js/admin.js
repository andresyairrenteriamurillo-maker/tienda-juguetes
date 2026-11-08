/* =========================================================
   PANEL DE PRODUCTOS
   Guarda los productos directamente en GitHub (archivo
   js/productos.js y fotos en img/productos/) usando una llave
   de acceso que el dueño crea en su cuenta. La llave nunca se
   escribe en el código: solo queda en el navegador del dueño.
   No necesitas editar este archivo.
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.TIENDA_CONFIG;
  var P = window.Pedido;
  var GH = CFG.github || {};
  var API = "https://api.github.com/repos/" + GH.usuario + "/" + GH.repositorio + "/contents/";
  var RAMA = GH.rama || "main";
  var ARCHIVO = "js/productos.js";
  var CLAVE_TOKEN = "panel_token_github";

  var token = "";
  var categorias = [];
  var productos = [];
  var shaArchivo = "";
  var editando = null;      // producto que se está editando (o null si es nuevo)
  var fotoNueva = null;     // { base64, ext } de la foto elegida
  var quitarFoto = false;
  var ocupado = false;
  var desdeTienda = false;  // true si se llegó desde el botón «Editar» o «Agregar» de la tienda
  var CLAVE_RECIENTE = "catalogo_reciente_v1";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  var ICONOS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    pencil: '<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5Z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'
  };
  function icono(n) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONOS[n] || "") + "</svg>";
  }
  function pintarIconos(ctx) { $$("[data-icon]", ctx).forEach(function (el) { el.innerHTML = icono(el.getAttribute("data-icon")); }); }

  var toastTimer;
  function aviso(texto, ms) {
    var t = $("#toast");
    t.textContent = texto;
    t.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("toast--visible"); }, ms || 3200);
  }

  /* ---------- Texto <-> base64 (con tildes y ñ) ---------- */
  function aBase64(texto) {
    var bytes = new TextEncoder().encode(texto);
    var bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function deBase64(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* ---------- GitHub ---------- */
  function gh(metodo, ruta, cuerpo) {
    var url = ruta.indexOf("https://") === 0 ? ruta : API + ruta;
    return fetch(url, {
      method: metodo,
      cache: "no-store",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    }).then(function (r) {
      if (r.status === 204) return {};
      return r.json().catch(function () { return {}; }).then(function (datos) {
        if (!r.ok) {
          var e = new Error(datos.message || ("Error " + r.status));
          e.status = r.status;
          throw e;
        }
        return datos;
      });
    });
  }

  function mensajeError(e) {
    if (e && e.status === 401) return "La llave no es válida o ya venció. Crea una nueva y vuelve a conectar.";
    if (e && (e.status === 403 || e.status === 404)) return "La llave no tiene permiso para esta tienda. Revisa que elegiste el repositorio «" + GH.repositorio + "» y el permiso Contents: Read and write.";
    if (e && e.status === 409) return "Alguien guardó cambios al mismo tiempo. Vuelve a intentarlo.";
    if (e && e.message === "Failed to fetch") return "No hay conexión a internet. Revisa tu conexión y vuelve a intentarlo.";
    return "No se pudo guardar: " + (e && e.message ? e.message : "error desconocido") + ".";
  }

  function leerCatalogo() {
    return gh("GET", ARCHIVO + "?ref=" + encodeURIComponent(RAMA)).then(function (d) {
      shaArchivo = d.sha;
      var codigo = deBase64(d.content);
      var caja = {};
      // El archivo solo asigna window.CATEGORIAS y window.PRODUCTOS
      new Function("window", codigo)(caja);
      categorias = caja.CATEGORIAS || [];
      productos = caja.PRODUCTOS || [];
    });
  }

  function generarArchivo() {
    var cab = [
      "/* =========================================================",
      "   CATÁLOGO DE PRODUCTOS",
      "   ---------------------------------------------------------",
      "   Este archivo lo actualiza el panel de productos (admin.html).",
      "   También puedes editarlo a mano con cuidado.",
      "",
      "   Campos de cada producto:",
      "   - id, nombre, descripcion",
      "   - precio y precioPromo (en pesos, sin puntos; precioPromo puede ser null)",
      "   - imagen: ruta de la foto (o \"\" para un dibujo provisional)",
      "   - categoria: una de las claves de CATEGORIAS",
      "   - stock: unidades disponibles (null = no se lleva inventario, 0 = agotado)",
      "   - activo, destacado, fechaCreacion (AAAA-MM-DD), demo",
      "   ========================================================= */",
      ""
    ].join("\n");
    var cats = "window.CATEGORIAS = [\n" + categorias.map(function (c) { return "  " + JSON.stringify(c); }).join(",\n") + "\n];\n";
    var prods = "window.PRODUCTOS = [\n" + productos.map(function (p) { return "  " + JSON.stringify(p); }).join(",\n") + "\n];\n";
    return cab + "\n" + cats + "\n" + prods;
  }

  function guardarCatalogo(mensaje, reintento) {
    return gh("PUT", ARCHIVO, {
      message: mensaje,
      content: aBase64(generarArchivo()),
      sha: shaArchivo,
      branch: RAMA
    }).then(function (d) {
      shaArchivo = d.content.sha;
      recordarCatalogo();
    }).catch(function (e) {
      if (e.status === 409 && !reintento) {
        // Otro cambio llegó primero: se toma la versión nueva y se repite
        var pendientes = productos;
        return gh("GET", ARCHIVO + "?ref=" + encodeURIComponent(RAMA)).then(function (d) {
          shaArchivo = d.sha;
          productos = pendientes;
          return guardarCatalogo(mensaje, true);
        });
      }
      throw e;
    });
  }

  // Copia del catálogo recién guardado: la tienda la usa en este dispositivo
  // mientras GitHub Pages termina de publicar (tarda unos minutos).
  function recordarCatalogo() {
    try {
      localStorage.setItem(CLAVE_RECIENTE, JSON.stringify({
        t: Date.now(),
        raw: "https://raw.githubusercontent.com/" + GH.usuario + "/" + GH.repositorio + "/" + RAMA + "/",
        categorias: categorias,
        productos: productos
      }));
    } catch (e) { /* sin almacenamiento */ }
  }

  function volverALaTienda(id) {
    location.href = "index.html" + (id ? "#p=" + encodeURIComponent(id) : "");
  }

  function subirFoto(id, foto) {
    var ruta = "img/productos/" + id.toLowerCase() + "-" + Date.now().toString(36) + "." + foto.ext;
    return gh("PUT", ruta, { message: "Foto de " + id, content: foto.base64, branch: RAMA }).then(function () { return ruta; });
  }

  function borrarArchivo(ruta) {
    if (!ruta || ruta.indexOf("img/productos/") !== 0) return Promise.resolve();
    return gh("GET", ruta + "?ref=" + encodeURIComponent(RAMA)).then(function (d) {
      return gh("DELETE", ruta, { message: "Borra foto " + ruta, sha: d.sha, branch: RAMA });
    }).catch(function () { /* si la foto ya no existe, no pasa nada */ });
  }

  /* ---------- Fotos: se reducen antes de subir ---------- */
  function prepararFoto(archivo) {
    return new Promise(function (ok, falla) {
      if (!archivo || !/^image\//.test(archivo.type)) { falla(new Error("El archivo no es una imagen.")); return; }
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function () {
        var max = 1200;
        var esc2 = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * esc2);
        c.height = Math.round(img.height * esc2);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var datos = c.toDataURL("image/jpeg", 0.82);
        ok({ base64: datos.split(",")[1], ext: "jpg", vista: datos });
      };
      img.onerror = function () { URL.revokeObjectURL(url); falla(new Error("No se pudo leer la foto. Prueba con otra en formato JPG o PNG.")); };
      img.src = url;
    });
  }

  /* ---------- Vistas ---------- */
  function mostrar(vista) {
    $("#cargando").hidden = vista !== "cargando";
    $("#vista-conectar").hidden = vista !== "conectar";
    $("#vista-productos").hidden = vista !== "productos";
  }

  var catPorClave = {};
  function pintarLista() {
    catPorClave = {};
    categorias.forEach(function (c) { catPorClave[c.clave] = c; });
    var q = $("#buscar-admin").value.trim().toLowerCase();
    var lista = productos.filter(function (p) { return !q || (p.nombre + " " + p.id).toLowerCase().indexOf(q) !== -1; })
      .slice().sort(function (a, b) { return String(b.fechaCreacion).localeCompare(String(a.fechaCreacion)); });

    var activos = productos.filter(function (p) { return p.activo; }).length;
    $("#resumen-productos").textContent = productos.length + (productos.length === 1 ? " producto" : " productos") + " · " + activos + " visibles en la tienda";

    var ejemplos = productos.filter(function (p) { return p.demo; }).length;
    $("#aviso-ejemplos").hidden = ejemplos === 0;
    $("#n-ejemplos").textContent = ejemplos;

    if (!lista.length) {
      $("#lista-admin").innerHTML = '<li class="vacio">' + (productos.length ? "No hay productos con esa búsqueda." : "Todavía no tienes productos. Pulsa «Agregar juguete» para subir el primero.") + "</li>";
      return;
    }
    $("#lista-admin").innerHTML = lista.map(function (p) {
      var cat = catPorClave[p.categoria] || { emoji: "🎁", nombre: "", color: "#888" };
      var final = (p.precioPromo && p.precioPromo < p.precio) ? p.precioPromo : p.precio;
      var stock = p.stock == null ? "Sin inventario" : (p.stock === 0 ? "Agotado" : p.stock + " unid.");
      return '<li class="item' + (p.activo ? "" : " item--oculto") + '">' +
        '<span class="item__foto" style="--c:' + esc(cat.color) + '">' + (p.imagen ? '<img src="' + esc(p.imagen) + '" alt="" loading="lazy" onerror="this.remove()">' : "") + '<span aria-hidden="true">' + cat.emoji + "</span></span>" +
        '<span class="item__info"><strong>' + esc(p.nombre) + "</strong>" +
          '<span class="item__meta">' + P.formatearCOP(final) + (final < p.precio ? ' <s>' + P.formatearCOP(p.precio) + "</s>" : "") + " · " + esc(stock) + " · " + esc(cat.nombre) + "</span>" +
          '<span class="item__tags">' + (p.demo ? '<span class="tag">Ejemplo</span>' : "") + (p.activo ? "" : '<span class="tag tag--oculto">Oculto</span>') + (p.destacado ? '<span class="tag tag--dest">Destacado</span>' : "") + "</span>" +
        "</span>" +
        '<span class="item__acciones">' +
          '<button class="btn-icono" data-editar="' + esc(p.id) + '" aria-label="Editar ' + esc(p.nombre) + '">' + icono("pencil") + "</button>" +
          '<button class="btn-icono btn--peligro" data-borrar="' + esc(p.id) + '" aria-label="Borrar ' + esc(p.nombre) + '">' + icono("trash") + "</button>" +
        "</span></li>";
    }).join("");
  }

  /* ---------- Formulario ---------- */
  function soloNumero(v) {
    var t = String(v || "").replace(/[^\d]/g, "");
    return t === "" ? null : parseInt(t, 10);
  }

  function siguienteId() {
    var max = 0;
    productos.forEach(function (p) {
      var m = /^J(\d+)$/.exec(p.id);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var n = String(max + 1);
    while (n.length < 3) n = "0" + n;
    return "J" + n;
  }

  function abrirFormulario(p) {
    editando = p || null;
    fotoNueva = null;
    quitarFoto = false;
    $("#titulo-form").textContent = p ? "Editar juguete" : "Agregar juguete";
    pintarSelectCategorias();
    $("#p-nombre").value = p ? p.nombre : "";
    $("#p-descripcion").value = p ? p.descripcion : "";
    $("#p-precio").value = p ? p.precio : "";
    $("#p-promo").value = p && p.precioPromo ? p.precioPromo : "";
    $("#p-categoria").value = p ? p.categoria : (categorias[0] ? categorias[0].clave : "");
    $("#p-stock").value = p && p.stock != null ? p.stock : "";
    $("#p-activo").checked = p ? !!p.activo : true;
    $("#p-destacado").checked = p ? !!p.destacado : false;
    $("#error-producto").textContent = "";
    $("#p-foto").value = "";
    vistaFoto(p && p.imagen ? p.imagen : "");
    $("#dlg-producto").showModal();
    setTimeout(function () { $("#p-nombre").focus(); }, 50);
  }

  /* ---------- Categorías ---------- */
  var COLORES = ["#14B8A6", "#A855F7", "#F59E0B", "#0EA5E9", "#84CC16", "#E11D48", "#64748B", "#DB2777", "#059669", "#7C3AED"];
  var catNueva = null;  // categoría creada desde el formulario del juguete, aún sin guardar

  function claveDe(nombre, usadas) {
    var base = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "categoria";
    var clave = base, n = 2;
    while (usadas.indexOf(clave) !== -1 || clave === "__promo") clave = base + n++;
    return clave;
  }

  function crearCategoria(nombre, emoji, lista) {
    return {
      clave: claveDe(nombre, lista.map(function (c) { return c.clave; })),
      nombre: nombre,
      emoji: emoji || "🎁",
      color: COLORES[lista.length % COLORES.length]
    };
  }

  function limpiarNombre(t) { return String(t || "").trim().replace(/\s+/g, " ").slice(0, 40); }

  function pintarSelectCategorias(elegida) {
    var sel = $("#p-categoria");
    sel.innerHTML = categorias.map(function (c) { return '<option value="' + esc(c.clave) + '">' + c.emoji + " " + esc(c.nombre) + "</option>"; }).join("") +
      '<option value="__nueva">➕ Nueva categoría…</option>';
    if (elegida) sel.value = elegida;
  }

  function elegirCategoria() {
    var sel = $("#p-categoria");
    if (sel.value !== "__nueva") { sel.dataset.antes = sel.value; return; }
    var nombre = limpiarNombre(window.prompt("Nombre de la nueva categoría (ej.: Loncheras y morrales)", ""));
    if (nombre.length < 2) { sel.value = sel.dataset.antes || (categorias[0] ? categorias[0].clave : ""); return; }
    var existe = categorias.filter(function (c) { return c.nombre.toLowerCase() === nombre.toLowerCase(); })[0];
    if (existe) { pintarSelectCategorias(existe.clave); sel.dataset.antes = existe.clave; return; }
    if (catNueva) categorias = categorias.filter(function (c) { return c !== catNueva; });
    catNueva = crearCategoria(nombre, "🎁", categorias);
    categorias = categorias.concat([catNueva]);
    pintarSelectCategorias(catNueva.clave);
    sel.dataset.antes = catNueva.clave;
    aviso("Categoría «" + nombre + "» lista. Se guarda junto con el juguete; el emoji lo cambias en «Categorías».", 5000);
  }

  // Si se cancela el formulario, la categoría nueva sin juguetes se descarta
  function descartarCatNueva() {
    if (!catNueva) return;
    var c = catNueva;
    catNueva = null;
    if (!productos.some(function (p) { return p.categoria === c.clave; })) categorias = categorias.filter(function (x) { return x !== c; });
  }

  var borradorCats = [];
  function cuantos(clave) { return productos.filter(function (p) { return p.categoria === clave; }).length; }

  function pintarCategorias() {
    $("#lista-cats").innerHTML = borradorCats.map(function (c, i) {
      var n = c.clave ? cuantos(c.clave) : 0;
      return '<li class="cat-fila" data-i="' + i + '">' +
        '<input class="cat-fila__emoji" value="' + esc(c.emoji) + '" maxlength="8" aria-label="Emoji de la categoría" data-campo="emoji">' +
        '<input class="cat-fila__nombre" value="' + esc(c.nombre) + '" maxlength="40" placeholder="Nombre de la categoría" aria-label="Nombre de la categoría" data-campo="nombre">' +
        '<span class="cat-fila__n">' + (n === 1 ? "1 juguete" : n + " juguetes") + "</span>" +
        '<button type="button" class="btn-icono btn--peligro" data-quitar="' + i + '"' + (n ? ' disabled title="Tiene juguetes: pásalos a otra categoría primero"' : "") + ' aria-label="Borrar categoría ' + esc(c.nombre) + '">' + icono("trash") + "</button>" +
        "</li>";
    }).join("");
  }

  function abrirCategorias() {
    borradorCats = categorias.map(function (c) { return { clave: c.clave, nombre: c.nombre, emoji: c.emoji, color: c.color }; });
    $("#error-cats").textContent = "";
    pintarCategorias();
    $("#dlg-categorias").showModal();
  }

  function bloquearCats(si) {
    ocupado = si;
    var b = $("#btn-guardar-cats");
    b.disabled = si;
    b.textContent = si ? "Publicando…" : "Guardar y publicar";
  }

  function guardarCategorias(e) {
    e.preventDefault();
    if (ocupado) return;
    var lista = [], vistos = {}, err = "";
    borradorCats.forEach(function (c) {
      var nombre = limpiarNombre(c.nombre);
      if (!c.clave && !nombre) return;  // fila nueva vacía: se ignora
      if (nombre.length < 2) err = err || "Cada categoría necesita un nombre.";
      else if (vistos[nombre.toLowerCase()]) err = err || "Hay dos categorías llamadas «" + nombre + "».";
      vistos[nombre.toLowerCase()] = true;
      var emoji = String(c.emoji || "").trim() || "🎁";
      lista.push(c.clave ? { clave: c.clave, nombre: nombre, emoji: emoji, color: c.color } : crearCategoria(nombre, emoji, lista.concat(categorias)));
    });
    if (!err && !lista.length) err = "Debe quedar al menos una categoría.";
    if (err) { $("#error-cats").textContent = err; return; }

    var copia = categorias;
    categorias = lista;
    bloquearCats(true);
    guardarCatalogo("Actualiza categorías").then(function () {
      bloquearCats(false);
      $("#dlg-categorias").close();
      pintarLista();
      aviso("Categorías guardadas. Para los clientes se actualizan en unos minutos.", 4500);
    }).catch(function (er) {
      categorias = copia;
      bloquearCats(false);
      $("#error-cats").textContent = mensajeError(er);
    });
  }

  function vistaFoto(src) {
    var img = $("#foto-preview");
    if (src) { img.src = src; img.hidden = false; $("#foto-vacia").hidden = true; $("#btn-quitar-foto").hidden = false; }
    else { img.removeAttribute("src"); img.hidden = true; $("#foto-vacia").hidden = false; $("#btn-quitar-foto").hidden = true; }
  }

  function bloquear(si, texto) {
    ocupado = si;
    var b = $("#btn-guardar");
    b.disabled = si;
    b.textContent = si ? (texto || "Guardando…") : "Guardar y publicar";
  }

  function guardarProducto(ev) {
    ev.preventDefault();
    if (ocupado) return;
    var nombre = $("#p-nombre").value.trim().replace(/\s+/g, " ");
    var precio = soloNumero($("#p-precio").value);
    var promo = soloNumero($("#p-promo").value);
    var stock = soloNumero($("#p-stock").value);
    var err = "";
    if (nombre.length < 2) err = "Escribe el nombre del juguete.";
    else if (!precio || precio < 100) err = "Escribe el precio en pesos, solo números. Ej.: 45000";
    else if (promo !== null && promo >= precio) err = "El precio en promoción debe ser menor que el precio normal.";
    if (err) { $("#error-producto").textContent = err; return; }

    // Los productos de ejemplo tienen código DEMO-xx: al editarlos pasan a ser reales con código propio
    var id = editando && !/^DEMO-/.test(editando.id) ? editando.id : siguienteId();
    var hoy = new Date();
    var fecha = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
    var anterior = editando ? editando.imagen : "";
    var datos = {
      id: id,
      nombre: nombre,
      descripcion: $("#p-descripcion").value.trim().replace(/\s+/g, " "),
      precio: precio,
      precioPromo: promo,
      imagen: anterior && !quitarFoto ? anterior : "",
      categoria: $("#p-categoria").value,
      stock: stock,
      activo: $("#p-activo").checked,
      destacado: $("#p-destacado").checked,
      fechaCreacion: editando ? editando.fechaCreacion : fecha,
      demo: false
    };

    var copia = productos.slice();
    bloquear(true, fotoNueva ? "Subiendo foto…" : "Guardando…");
    var paso = fotoNueva ? subirFoto(id, fotoNueva).then(function (ruta) { datos.imagen = ruta; }) : Promise.resolve();
    paso.then(function () {
      bloquear(true, "Publicando…");
      if (editando) productos = productos.map(function (x) { return x.id === editando.id ? datos : x; });
      else productos = productos.concat([datos]);
      return guardarCatalogo((editando ? "Actualiza " : "Agrega ") + nombre);
    }).then(function () {
      catNueva = null;
      if (anterior && anterior !== datos.imagen) borrarArchivo(anterior);
      bloquear(false);
      if (desdeTienda) {
        aviso("«" + nombre + "» guardado. Volviendo a la tienda…", 4500);
        setTimeout(function () { volverALaTienda(datos.activo ? id : ""); }, 900);
        return;
      }
      $("#dlg-producto").close();
      pintarLista();
      aviso("«" + nombre + "» guardado. En este dispositivo ya lo ves en la tienda; para los clientes aparece en unos minutos.", 5000);
    }).catch(function (e) {
      productos = copia;
      bloquear(false);
      $("#error-producto").textContent = mensajeError(e);
    });
  }

  function borrarProducto(id) {
    var p = productos.filter(function (x) { return x.id === id; })[0];
    if (!p || ocupado) return;
    if (!window.confirm("¿Borrar «" + p.nombre + "» de la tienda? Esta acción no se puede deshacer.")) return;
    var copia = productos.slice();
    productos = productos.filter(function (x) { return x.id !== id; });
    ocupado = true;
    aviso("Borrando…");
    guardarCatalogo("Borra " + p.nombre).then(function () {
      ocupado = false;
      borrarArchivo(p.imagen);
      pintarLista();
      aviso("Producto borrado. La tienda se actualizará en unos minutos.");
    }).catch(function (e) {
      ocupado = false;
      productos = copia;
      pintarLista();
      aviso(mensajeError(e), 6000);
    });
  }

  function borrarEjemplos() {
    var n = productos.filter(function (p) { return p.demo; }).length;
    if (!n || ocupado) return;
    if (!window.confirm("¿Borrar los " + n + " productos de ejemplo? Tus productos no se tocan.")) return;
    var copia = productos.slice();
    productos = productos.filter(function (p) { return !p.demo; });
    ocupado = true;
    aviso("Borrando ejemplos…");
    guardarCatalogo("Borra productos de ejemplo").then(function () {
      ocupado = false;
      pintarLista();
      aviso("Ejemplos borrados.");
    }).catch(function (e) {
      ocupado = false;
      productos = copia;
      pintarLista();
      aviso(mensajeError(e), 6000);
    });
  }

  /* ---------- Conexión ---------- */
  function leerToken() {
    try { return sessionStorage.getItem(CLAVE_TOKEN) || localStorage.getItem(CLAVE_TOKEN) || ""; } catch (e) { return ""; }
  }
  function guardarToken(t, recordar) {
    try {
      sessionStorage.setItem(CLAVE_TOKEN, t);
      if (recordar) localStorage.setItem(CLAVE_TOKEN, t); else localStorage.removeItem(CLAVE_TOKEN);
    } catch (e) { /* sin almacenamiento: queda solo mientras la página esté abierta */ }
  }
  function borrarToken() {
    try { sessionStorage.removeItem(CLAVE_TOKEN); localStorage.removeItem(CLAVE_TOKEN); } catch (e) { /* nada */ }
  }

  function conectar(t, recordar, desdeFormulario) {
    token = t;
    mostrar("cargando");
    return leerCatalogo().then(function () {
      if (desdeFormulario) guardarToken(t, recordar);
      mostrar("productos");
      pintarLista();
      pintarAvisoClave();
      abrirDesdeTienda();
    }).catch(function (e) {
      token = "";
      if (!desdeFormulario) borrarToken();
      mostrarConectar();
      var msj = mensajeError(e);
      if (acceso && e && e.status === 401) msj = "La llave guardada con la contraseña ya venció. Crea una llave nueva abajo y luego cambia la contraseña.";
      $(acceso ? "#error-clave" : "#error-conectar").textContent = msj;
    });
  }

  // admin.html#editar=J001 o admin.html#nuevo (enlaces desde la tienda)
  function abrirDesdeTienda() {
    var h = location.hash;
    var m = /#editar=([^&]+)/.exec(h);
    if (m) {
      var id = decodeURIComponent(m[1]);
      var p = productos.filter(function (x) { return x.id === id; })[0];
      if (p) { desdeTienda = true; abrirFormulario(p); }
    } else if (h === "#nuevo") {
      desdeTienda = true;
      abrirFormulario(null);
    }
    if (desdeTienda) history.replaceState(null, "", location.pathname);
  }

  function usarArchivoFoto(f) {
    if (!f) return;
    $("#error-producto").textContent = "";
    prepararFoto(f).then(function (foto) {
      fotoNueva = foto;
      quitarFoto = false;
      vistaFoto(foto.vista);
    }).catch(function (e) { $("#error-producto").textContent = e.message; });
  }

  /* ---------- Datos de la tienda (js/config.js) ---------- */
  var ARCHIVO_CONFIG = "js/config.js";
  var cfgActual = null, shaConfig = "";

  function leerConfig() {
    return gh("GET", ARCHIVO_CONFIG + "?ref=" + encodeURIComponent(RAMA)).then(function (d) {
      shaConfig = d.sha;
      var caja = {};
      new Function("window", deBase64(d.content))(caja);
      cfgActual = caja.TIENDA_CONFIG;
      return cfgActual;
    });
  }

  function js(v) { return JSON.stringify(v); }
  function generarConfig(c) {
    var h = c.horarios.map(function (x) { return "    { dias: " + js(x.dias) + ", horas: " + js(x.horas) + " }"; }).join(",\n");
    var ins = c.instruccionesRecogida.map(function (x) { return "    " + js(x); }).join(",\n");
    return [
      "/* =========================================================",
      "   CONFIGURACIÓN DE LA TIENDA",
      "   ---------------------------------------------------------",
      "   Lo más fácil es cambiar estos datos desde el panel:",
      "   Administrar → Datos de la tienda. También puedes editar",
      "   aquí lo que está entre comillas y guardar.",
      "   ========================================================= */",
      "",
      "window.TIENDA_CONFIG = {",
      "  // Nombre que aparece en el encabezado, el pie de página y el mensaje de WhatsApp",
      "  nombre: " + js(c.nombre) + ",",
      "",
      "  // Frase corta debajo del nombre",
      "  eslogan: " + js(c.eslogan) + ",",
      "",
      "  // WhatsApp en formato internacional: 57 + 10 dígitos, sin espacios ni \"+\"",
      "  whatsapp: " + js(c.whatsapp) + ",",
      "",
      "  // Cómo se muestra el teléfono en la página",
      "  telefonoVisible: " + js(c.telefonoVisible) + ",",
      "",
      "  // Correo de contacto (pie de página y política de datos)",
      "  correo: " + js(c.correo) + ",",
      "",
      "  // Dirección donde los clientes recogen sus pedidos",
      "  direccion: " + js(c.direccion) + ",",
      "  ciudad: " + js(c.ciudad) + ",",
      "",
      "  // Enlace de Google Maps (opcional). \"\" si no tienes.",
      "  mapaUrl: " + js(c.mapaUrl) + ",",
      "",
      "  // Horarios de atención y de recogida",
      "  horarios: [",
      h,
      "  ],",
      "",
      "  // Instrucciones que verá el cliente antes de enviar el pedido",
      "  instruccionesRecogida: [",
      ins,
      "  ],",
      "",
      "  // true = el formulario pide el documento de identidad (siempre opcional)",
      "  pedirDocumento: " + js(!!c.pedirDocumento) + ",",
      "",
      "  // Datos del responsable del tratamiento de datos (política de privacidad)",
      "  responsable: {",
      "    razonSocial: " + js(c.responsable.razonSocial) + ",",
      "    nit: " + js(c.responsable.nit),
      "  },",
      "",
      "  // Dónde está guardada la tienda en GitHub (lo usa el panel). No es una contraseña.",
      "  github: {",
      "    usuario: " + js(c.github.usuario) + ",",
      "    repositorio: " + js(c.github.repositorio) + ",",
      "    rama: " + js(c.github.rama),
      "  },",
      "",
      "  // true = muestra el aviso de \"tienda de demostración\"",
      "  modoDemo: " + js(!!c.modoDemo),
      "};",
      ""
    ].join("\n");
  }

  function lineas(t) { return t.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }

  function abrirDatos() {
    $("#error-datos").textContent = "";
    var b = $("#btn-datos");
    b.disabled = true;
    leerConfig().then(function (c) {
      b.disabled = false;
      $("#d-nombre").value = c.nombre || "";
      $("#d-eslogan").value = c.eslogan || "";
      var w = String(c.whatsapp || "").replace(/^57/, "");
      $("#d-whatsapp").value = w.length === 10 ? w.slice(0, 3) + " " + w.slice(3, 6) + " " + w.slice(6) : w;
      $("#d-correo").value = c.correo || "";
      $("#d-direccion").value = c.direccion || "";
      $("#d-ciudad").value = c.ciudad || "";
      $("#d-mapa").value = c.mapaUrl || "";
      $("#d-horarios").value = (c.horarios || []).map(function (h) { return h.dias + ": " + h.horas; }).join("\n");
      $("#d-instrucciones").value = (c.instruccionesRecogida || []).join("\n");
      $("#d-razon").value = c.responsable ? c.responsable.razonSocial : "";
      $("#d-nit").value = c.responsable ? c.responsable.nit : "";
      $("#d-documento").checked = !!c.pedirDocumento;
      $("#d-demo").checked = !!c.modoDemo;
      $("#dlg-datos").showModal();
    }).catch(function (e) { b.disabled = false; aviso(mensajeError(e), 6000); });
  }

  function guardarDatos(e) {
    e.preventDefault();
    if (ocupado) return;
    var cel = $("#d-whatsapp").value.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");
    var correo = $("#d-correo").value.trim();
    var mapa = $("#d-mapa").value.trim();
    var horarios = lineas($("#d-horarios").value).map(function (l) {
      // El primer «:» que no sea parte de una hora (ej. «9:00») separa días y horas
      var m = /^([^:]*?\D)\s*:\s*(.+)$/.exec(l);
      return m ? { dias: m[1].trim(), horas: m[2].trim() } : { dias: l, horas: "" };
    });
    var err = "";
    if ($("#d-nombre").value.trim().length < 2) err = "Escribe el nombre de la tienda.";
    else if (!/^3\d{9}$/.test(cel)) err = "El WhatsApp debe ser un celular colombiano de 10 dígitos que empiece por 3.";
    else if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) err = "Revisa el correo.";
    else if (!$("#d-direccion").value.trim() || !$("#d-ciudad").value.trim()) err = "Escribe la dirección y la ciudad.";
    else if (mapa && !/^https:\/\//.test(mapa)) err = "El enlace del mapa debe empezar por https://";
    else if (!horarios.length) err = "Escribe al menos un horario.";
    $("#error-datos").textContent = err;
    if (err) return;

    var c = JSON.parse(JSON.stringify(cfgActual));
    c.nombre = $("#d-nombre").value.trim();
    c.eslogan = $("#d-eslogan").value.trim();
    c.whatsapp = "57" + cel;
    c.telefonoVisible = cel.slice(0, 3) + " " + cel.slice(3, 6) + " " + cel.slice(6);
    c.correo = correo;
    c.direccion = $("#d-direccion").value.trim();
    c.ciudad = $("#d-ciudad").value.trim();
    c.mapaUrl = mapa;
    c.horarios = horarios;
    c.instruccionesRecogida = lineas($("#d-instrucciones").value);
    c.responsable = { razonSocial: $("#d-razon").value.trim(), nit: $("#d-nit").value.trim() };
    c.pedirDocumento = $("#d-documento").checked;
    c.modoDemo = $("#d-demo").checked;
    c.github = cfgActual.github || GH;

    var b = $("#btn-guardar-datos");
    ocupado = true; b.disabled = true; b.textContent = "Publicando…";
    gh("PUT", ARCHIVO_CONFIG, { message: "Actualiza datos de la tienda", content: aBase64(generarConfig(c)), sha: shaConfig, branch: RAMA }).then(function () {
      cfgActual = c;
      try { localStorage.setItem("config_reciente_v1", JSON.stringify({ t: Date.now(), config: c })); } catch (er) { /* nada */ }
      ocupado = false; b.disabled = false; b.textContent = "Guardar y publicar";
      $("#dlg-datos").close();
      aviso("Datos guardados. En este dispositivo ya los ves en la tienda; para los clientes aparecen en unos minutos.", 5000);
    }).catch(function (er) {
      ocupado = false; b.disabled = false; b.textContent = "Guardar y publicar";
      $("#error-datos").textContent = mensajeError(er);
    });
  }

  /* ---------- Contraseña del panel ----------
     La llave de GitHub se guarda en el repositorio (acceso.json) CIFRADA
     con la contraseña (AES-GCM + PBKDF2). Sin la contraseña no sirve. */
  var ARCHIVO_ACCESO = "acceso.json";
  var acceso = null;
  var ITER = 600000;

  function bytesA64(b) { var s = ""; new Uint8Array(b).forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s); }
  function b64ABytes(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }

  function derivar(clave, sal, iter) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function cifrar(texto, clave) {
    var sal = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return derivar(clave, sal, ITER).then(function (k) {
      return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(texto));
    }).then(function (c) {
      return { v: 1, iter: ITER, sal: bytesA64(sal), iv: bytesA64(iv), datos: bytesA64(c), fecha: new Date().toISOString().slice(0, 10) };
    });
  }
  function descifrar(a, clave) {
    return derivar(clave, b64ABytes(a.sal), a.iter).then(function (k) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ABytes(a.iv) }, k, b64ABytes(a.datos));
    }).then(function (t) { return new TextDecoder().decode(t); });
  }

  function cargarAcceso() {
    var raw = "https://raw.githubusercontent.com/" + GH.usuario + "/" + GH.repositorio + "/" + RAMA + "/" + ARCHIVO_ACCESO + "?t=" + Date.now();
    var leer = function (url) { return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }); };
    return leer(raw).catch(function () { return leer(ARCHIVO_ACCESO + "?t=" + Date.now()); })
      .then(function (a) { acceso = a && a.datos ? a : null; })
      .catch(function () { acceso = null; });
  }

  function pintarAvisoClave() {
    $("#aviso-clave").hidden = false;
    $("#texto-clave").textContent = acceso
      ? "Ya tienes contraseña del panel (creada el " + (acceso.fecha || "") + "). En otro dispositivo entra a «Administrar» y escríbela. Si quieres, cámbiala aquí."
      : "Crea una contraseña y en cualquier otro celular o computador solo tendrás que escribirla, sin crear otra llave.";
    $("#btn-crear-clave").textContent = acceso ? "Cambiar contraseña" : "Guardar contraseña";
  }

  function crearClave(e) {
    e.preventDefault();
    var c1 = $("#clave-nueva").value, c2 = $("#clave-repetir").value;
    var err = "";
    if (c1.length < 10) err = "Usa al menos 10 caracteres. Mejor una frase, por ejemplo «osito-azul-de-mi-tienda».";
    else if (c1 !== c2) err = "Las dos contraseñas no son iguales.";
    $("#error-crear-clave").textContent = err;
    if (err) return;
    var b = $("#btn-crear-clave");
    b.disabled = true; b.textContent = "Guardando…";
    cifrar(token, c1).then(function (a) {
      return gh("GET", ARCHIVO_ACCESO + "?ref=" + encodeURIComponent(RAMA)).then(function (d) { return d.sha; }, function () { return undefined; }).then(function (sha) {
        var cuerpo = { message: "Contraseña del panel", content: aBase64(JSON.stringify(a, null, 2) + "\n"), branch: RAMA };
        if (sha) cuerpo.sha = sha;
        return gh("PUT", ARCHIVO_ACCESO, cuerpo);
      }).then(function () { acceso = a; });
    }).then(function () {
      $("#form-crear-clave").reset();
      b.disabled = false;
      pintarAvisoClave();
      aviso("Contraseña guardada. Ya puedes entrar desde otro dispositivo.", 5000);
    }).catch(function (er) {
      b.disabled = false;
      pintarAvisoClave();
      $("#error-crear-clave").textContent = mensajeError(er);
    });
  }

  function entrarConClave(e) {
    e.preventDefault();
    var clave = $("#clave-entrar").value;
    if (!clave || !acceso) return;
    var b = $("#btn-entrar");
    b.disabled = true; b.textContent = "Entrando…";
    $("#error-clave").textContent = "";
    descifrar(acceso, clave).then(function (t) {
      return conectar(t, $("#recordar-clave").checked, true);
    }, function () {
      $("#error-clave").textContent = "Contraseña incorrecta.";
    }).then(function () {
      b.disabled = false; b.textContent = "Entrar";
      $("#clave-entrar").value = "";
    });
  }

  function mostrarConectar() {
    mostrar("conectar");
    var conClave = !!acceso;
    $("#bloque-clave").hidden = !conClave;
    // Con contraseña, el bloque de la llave queda dentro de «¿Olvidaste la contraseña?»
    if (conClave) $("#hueco-llave").appendChild($("#bloque-llave"));
    if (conClave) setTimeout(function () { $("#clave-entrar").focus(); }, 50);
  }

  /* ---------- Eventos ---------- */
  function eventos() {
    $("#form-clave").addEventListener("submit", entrarConClave);
    $("#btn-datos").addEventListener("click", abrirDatos);
    $("#btn-categorias").addEventListener("click", abrirCategorias);
    $("#form-categorias").addEventListener("submit", guardarCategorias);
    $("#dlg-categorias").addEventListener("cancel", function (e) { if (ocupado) e.preventDefault(); });
    $("#lista-cats").addEventListener("input", function (e) {
      var f = e.target.closest(".cat-fila"), campo = e.target.getAttribute("data-campo");
      if (f && campo) borradorCats[+f.getAttribute("data-i")][campo] = e.target.value;
      $("#error-cats").textContent = "";
    });
    $("#lista-cats").addEventListener("click", function (e) {
      var b = e.target.closest("[data-quitar]");
      if (!b || b.disabled) return;
      borradorCats.splice(+b.getAttribute("data-quitar"), 1);
      pintarCategorias();
    });
    $("#btn-agregar-cat").addEventListener("click", function () {
      borradorCats.push({ clave: "", nombre: "", emoji: "🎁", color: "" });
      pintarCategorias();
      var filas = $$(".cat-fila__nombre");
      filas[filas.length - 1].focus();
    });
    $("#p-categoria").addEventListener("change", elegirCategoria);
    $("#form-datos").addEventListener("submit", guardarDatos);
    $("#form-datos").addEventListener("input", function () { $("#error-datos").textContent = ""; });
    $("#dlg-datos").addEventListener("cancel", function (e) { if (ocupado) e.preventDefault(); });
    $("#form-crear-clave").addEventListener("submit", crearClave);
    $("#form-conectar").addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("#token").value.trim();
      $("#error-conectar").textContent = "";
      if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) {
        $("#error-conectar").textContent = "Esa no parece una llave de GitHub. Debe empezar por github_pat_.";
        return;
      }
      conectar(t, $("#recordar").checked, true).then(function () { $("#token").value = ""; });
    });

    $("#btn-desconectar").addEventListener("click", function () {
      borrarToken();
      token = "";
      productos = [];
      mostrarConectar();
      aviso("Este dispositivo quedó desconectado.");
    });

    $("#btn-nuevo").addEventListener("click", function () { abrirFormulario(null); });
    $("#btn-borrar-ejemplos").addEventListener("click", borrarEjemplos);
    $("#buscar-admin").addEventListener("input", pintarLista);
    $("#form-producto").addEventListener("submit", guardarProducto);
    $("#form-producto").addEventListener("input", function () { $("#error-producto").textContent = ""; });

    $("#lista-admin").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-editar")) {
        var id = b.getAttribute("data-editar");
        abrirFormulario(productos.filter(function (p) { return p.id === id; })[0]);
      } else if (b.hasAttribute("data-borrar")) borrarProducto(b.getAttribute("data-borrar"));
    });

    $("#p-foto").addEventListener("change", function () { usarArchivoFoto(this.files && this.files[0]); });
    // En computador: arrastrar la foto o pegarla (Ctrl+V)
    var zona = $("#zona-foto");
    ["dragenter", "dragover"].forEach(function (t) {
      zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.add("foto-subir__zona--encima"); });
    });
    ["dragleave", "drop"].forEach(function (t) {
      zona.addEventListener(t, function () { zona.classList.remove("foto-subir__zona--encima"); });
    });
    zona.addEventListener("drop", function (e) {
      e.preventDefault();
      usarArchivoFoto(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
    });
    document.addEventListener("paste", function (e) {
      if (!$("#dlg-producto").open || !e.clipboardData) return;
      var f = Array.prototype.filter.call(e.clipboardData.files || [], function (x) { return /^image\//.test(x.type); })[0];
      if (f) { e.preventDefault(); usarArchivoFoto(f); }
    });
    $("#btn-quitar-foto").addEventListener("click", function () {
      fotoNueva = null;
      quitarFoto = true;
      $("#p-foto").value = "";
      vistaFoto("");
    });

    // Solo números en los precios y unidades
    ["#p-precio", "#p-promo", "#p-stock"].forEach(function (s) {
      $(s).addEventListener("input", function () {
        var n = this.value.replace(/[^\d]/g, "");
        this.value = n;
      });
    });

    $$("[data-cerrar]").forEach(function (b) {
      b.addEventListener("click", function () { if (!ocupado) b.closest("dialog").close(); });
    });
    // Si se vino desde la tienda y se cancela, se regresa a la tienda
    $("#dlg-producto").addEventListener("close", function () {
      descartarCatNueva();
      if (desdeTienda && !ocupado) volverALaTienda(editando ? editando.id : "");
    });
    $("#dlg-producto").addEventListener("cancel", function (e) { if (ocupado) e.preventDefault(); });

    $("#btn-tema").addEventListener("click", function () {
      var nuevo = document.documentElement.getAttribute("data-tema") === "oscuro" ? "claro" : "oscuro";
      document.documentElement.setAttribute("data-tema", nuevo);
      try { localStorage.setItem("tema", nuevo); } catch (e) { /* nada */ }
    });

    window.addEventListener("beforeunload", function (e) { if (ocupado) { e.preventDefault(); e.returnValue = ""; } });
  }

  /* ---------- Inicio ---------- */
  pintarIconos(document);
  $("#nombre-repo").textContent = GH.repositorio || "";
  $("#enlace-crear-llave").href = "https://github.com/settings/personal-access-tokens/new" +
    "?name=" + encodeURIComponent("Panel " + (GH.repositorio || "tienda")) +
    "&description=" + encodeURIComponent("Panel de productos de la tienda") +
    "&target_name=" + encodeURIComponent(GH.usuario || "") +
    "&expires_in=365&contents=write";
  var btnPegar = $("#btn-pegar");
  if (navigator.clipboard && navigator.clipboard.readText) {
    btnPegar.addEventListener("click", function () {
      navigator.clipboard.readText().then(function (t) { $("#token").value = t.trim(); }, function () { $("#token").focus(); });
    });
  } else btnPegar.hidden = true;
  eventos();
  var guardado = leerToken();
  cargarAcceso().then(function () {
    if (guardado) conectar(guardado, false, false);
    else mostrarConectar();
  });
})();
