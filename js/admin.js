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
    $("#p-categoria").innerHTML = categorias.map(function (c) { return '<option value="' + esc(c.clave) + '">' + c.emoji + " " + esc(c.nombre) + "</option>"; }).join("");
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

    var id = editando ? editando.id : siguienteId();
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
      if (editando) productos = productos.map(function (x) { return x.id === id ? datos : x; });
      else productos = productos.concat([datos]);
      return guardarCatalogo((editando ? "Actualiza " : "Agrega ") + nombre);
    }).then(function () {
      if (anterior && anterior !== datos.imagen) borrarArchivo(anterior);
      bloquear(false);
      $("#dlg-producto").close();
      pintarLista();
      aviso("«" + nombre + "» guardado. Aparecerá en la tienda en unos minutos.", 4500);
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
    }).catch(function (e) {
      token = "";
      if (!desdeFormulario) borrarToken();
      mostrar("conectar");
      $("#error-conectar").textContent = mensajeError(e);
    });
  }

  /* ---------- Eventos ---------- */
  function eventos() {
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
      mostrar("conectar");
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

    $("#p-foto").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      $("#error-producto").textContent = "";
      prepararFoto(f).then(function (foto) {
        fotoNueva = foto;
        quitarFoto = false;
        vistaFoto(foto.vista);
      }).catch(function (e) { $("#error-producto").textContent = e.message; });
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
  eventos();
  var guardado = leerToken();
  if (guardado) conectar(guardado, false, false);
  else mostrar("conectar");
})();
