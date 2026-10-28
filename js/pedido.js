/* =========================================================
   LÓGICA DEL PEDIDO (precios, totales, validación y WhatsApp)
   No necesitas editar este archivo.
   ========================================================= */
(function (global) {
  "use strict";

  /** 45000 -> "$45.000"  |  con sufijo -> "$45.000 COP" */
  function formatearCOP(valor, conSufijo) {
    var n = Math.round(Number(valor) || 0);
    var signo = n < 0 ? "-" : "";
    var miles = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return signo + "$" + miles + (conSufijo ? " COP" : "");
  }

  /** Precio que paga el cliente (promocional si existe y es menor). */
  function precioFinal(p) {
    if (p.precioPromo != null && p.precioPromo > 0 && p.precioPromo < p.precio) return p.precioPromo;
    return p.precio;
  }

  function estaDisponible(p) {
    if (!p || !p.activo) return false;
    if (p.stock === null || p.stock === undefined) return true;
    return p.stock > 0;
  }

  /** Máximo de unidades que se pueden pedir de un producto. */
  function maximoUnidades(p) {
    if (p.stock === null || p.stock === undefined) return 99;
    return Math.max(0, Math.min(99, p.stock));
  }

  /** items: [{ producto, cantidad }] */
  function calcularTotales(items) {
    var lineas = items.map(function (it) {
      var unitario = precioFinal(it.producto);
      return { producto: it.producto, cantidad: it.cantidad, unitario: unitario, subtotal: unitario * it.cantidad };
    });
    var subtotal = lineas.reduce(function (s, l) { return s + l.subtotal; }, 0);
    var unidades = lineas.reduce(function (s, l) { return s + l.cantidad; }, 0);
    return { lineas: lineas, subtotal: subtotal, total: subtotal, unidades: unidades };
  }

  /** Quita caracteres de control y espacios repetidos; corta a un largo máximo. */
  function limpiarTexto(texto, max) {
    return String(texto || "")
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max || 200);
  }

  /** Deja solo dígitos. Acepta "300 123 4567", "+57 300...", etc. */
  function normalizarCelular(valor) {
    var d = String(valor || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("57") === 0) d = d.slice(2);
    return d;
  }

  function validarDatos(datos, opciones) {
    var errores = {};
    var nombre = limpiarTexto(datos.nombre, 80);
    if (nombre.length < 3) errores.nombre = "Escribe tu nombre completo.";
    else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(nombre)) errores.nombre = "El nombre solo puede tener letras y espacios.";
    else if (nombre.split(" ").filter(Boolean).length < 2) errores.nombre = "Escribe nombre y apellido.";

    var cel = normalizarCelular(datos.celular);
    if (!/^3\d{9}$/.test(cel)) errores.celular = "Escribe un celular colombiano de 10 dígitos que empiece por 3.";

    if (opciones && opciones.pedirDocumento && datos.documento) {
      var doc = String(datos.documento).replace(/\D/g, "");
      if (doc.length < 5 || doc.length > 12) errores.documento = "El documento debe tener entre 5 y 12 dígitos.";
    }
    if (datos.metodoPago !== "transferencia" && datos.metodoPago !== "efectivo") errores.metodoPago = "Elige cómo deseas pagar.";
    if (!datos.aceptaDatos) errores.aceptaDatos = "Debes aceptar la política de tratamiento de datos para continuar.";
    return errores;
  }

  var NOMBRES_PAGO = { transferencia: "Transferencia bancaria", efectivo: "Efectivo al recoger el pedido" };

  function construirMensaje(datos, items, cfg) {
    var t = calcularTotales(items);
    var r = [];
    r.push("🧸 *NUEVO PEDIDO - " + limpiarTexto(cfg.nombre, 80).toUpperCase() + "*");
    r.push("");
    r.push("Hola, quiero confirmar el siguiente pedido:");
    r.push("");
    r.push("*DATOS DEL CLIENTE*");
    r.push("Nombre: " + limpiarTexto(datos.nombre, 80));
    r.push("Celular: " + normalizarCelular(datos.celular));
    var doc = String(datos.documento || "").replace(/\D/g, "");
    if (cfg.pedirDocumento && doc) r.push("Documento: " + doc);
    r.push("");
    r.push("*PRODUCTOS SOLICITADOS*");
    t.lineas.forEach(function (l, i) {
      r.push((i + 1) + ". " + l.producto.nombre + " (Ref. " + l.producto.id + ")");
      r.push("   Cantidad: " + l.cantidad);
      r.push("   Precio unitario: " + formatearCOP(l.unitario) + (l.unitario < l.producto.precio ? " (promoción)" : ""));
      r.push("   Subtotal: " + formatearCOP(l.subtotal));
      r.push("");
    });
    r.push("*RESUMEN DEL PEDIDO*");
    r.push("Subtotal: " + formatearCOP(t.subtotal));
    r.push("Total: " + formatearCOP(t.total));
    r.push("");
    r.push("*MÉTODO DE PAGO*");
    r.push(NOMBRES_PAGO[datos.metodoPago] || "");
    r.push("");
    r.push("*ENTREGA*");
    r.push("Recoger personalmente en la tienda.");
    r.push("");
    r.push("*OBSERVACIONES*");
    r.push(limpiarTexto(datos.observaciones, 300) || "Sin observaciones.");
    r.push("");
    r.push("Por favor, confirma la disponibilidad de los productos y los detalles para realizar el pago y recoger el pedido.");
    return r.join("\n");
  }

  function construirEnlaceWhatsApp(numero, mensaje) {
    var num = String(numero || "").replace(/\D/g, "");
    return "https://wa.me/" + num + (mensaje ? "?text=" + encodeURIComponent(mensaje) : "");
  }

  var api = {
    formatearCOP: formatearCOP, precioFinal: precioFinal, estaDisponible: estaDisponible,
    maximoUnidades: maximoUnidades, calcularTotales: calcularTotales, limpiarTexto: limpiarTexto,
    normalizarCelular: normalizarCelular, validarDatos: validarDatos, construirMensaje: construirMensaje,
    construirEnlaceWhatsApp: construirEnlaceWhatsApp, NOMBRES_PAGO: NOMBRES_PAGO
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Pedido = api;
})(typeof window !== "undefined" ? window : globalThis);
