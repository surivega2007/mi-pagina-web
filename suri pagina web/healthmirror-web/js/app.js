
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const pesos = n => '$' + Math.round(n).toLocaleString('es-CO');

  /*  aviso flotante  */
  const aviso = $('#aviso');
  let avisoT;
  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('visible');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => aviso.classList.remove('visible'), 3200);
  }

  /*  BARRA Y MENÚ */
  const barra = $('#barra');
  const nav = $('#nav');
  const hamburguesa = $('#hamburguesa');

  window.addEventListener('scroll', () => {
    barra.classList.toggle('fija', window.scrollY > 20);
  }, { passive: true });

  hamburguesa.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    hamburguesa.setAttribute('aria-expanded', String(abierto));
    hamburguesa.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('abierto');
    hamburguesa.setAttribute('aria-expanded', 'false');
  }));

  /*  1) MAQUETA VIVA DEL ESPEJO  */
  const reloj = $('#reloj');
  const fechaEl = $('#fecha');

  function pintarHora() {
    const ahora = new Date();
    reloj.textContent = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    const f = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    fechaEl.textContent = f.charAt(0).toUpperCase() + f.slice(1);
  }
  pintarHora();
  setInterval(pintarHora, 15000);

  const rutina = [
    { nombre: 'Limpieza facial', seg: 120 },
    { nombre: 'Tónico',          seg: 60  },
    { nombre: 'Hidratación',     seg: 90  },
    { nombre: 'Protector solar', seg: 60  }
  ];

  const itemsPaso   = $$('#pasos li');
  const timerEl     = $('#timer');
  const timerEt     = $('#timerEtiqueta');
  const anillo      = $('#anilloValor');
  const LARGO       = 327; // 2πr con r = 52
  let idx = 0, restante = rutina[0].seg;

  function mmss(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function pintarRutina() {
    itemsPaso.forEach((li, i) => {
      li.classList.toggle('activo', i === idx);
      li.classList.toggle('hecho', i < idx);
    });
    timerEt.textContent = rutina[idx].nombre;
    timerEl.textContent = mmss(restante);
    anillo.style.strokeDashoffset = LARGO * (1 - restante / rutina[idx].seg);
  }
  pintarRutina();

  // Avance acelerado: es una demostración del producto, no un cronómetro real.
  setInterval(() => {
    restante -= 5;
    if (restante <= 0) {
      idx = (idx + 1) % rutina.length;
      restante = rutina[idx].seg;
    }
    pintarRutina();
  }, 900);

  /*  MODALES (apertura, cierre, foco)  */
  let ultimoFoco = null;

  function abrirModal(id, disparador) {
    const m = document.getElementById(id);
    if (!m) return;
    ultimoFoco = disparador || document.activeElement;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    const primero = m.querySelector('input, select, textarea, button:not(.modal__x)');
    if (primero) setTimeout(() => primero.focus(), 120);
  }

  function cerrarModal(m) {
    m.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco) ultimoFoco.focus();
  }

  $$('[data-abrir]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.abrir;
      // Si el botón viene de un plan, preselecciona ese modelo
      if (btn.dataset.modelo) seleccionarModelo(btn.dataset.modelo);
      abrirModal(id, btn);
    });
  });

  $$('[data-cerrar]').forEach(el => {
    el.addEventListener('click', () => cerrarModal(el.closest('.modal')));
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const abierto = $$('.modal').find(m => !m.hidden);
    if (abierto) cerrarModal(abierto);
  });

  // Mantener el foco dentro del modal abierto
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const m = $$('.modal').find(x => !x.hidden);
    if (!m) return;
    const foco = $$('button, input, select, textarea, a[href]', m)
      .filter(el => el.offsetParent !== null && !el.disabled);
    if (!foco.length) return;
    const primero = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  /*  VALIDACIÓN REUTILIZABLE  */
  function marcar(input, mensaje) {
    const campo = input.closest('.campo');
    const err = $(`[data-error="${input.id}"]`);
    campo.classList.toggle('malo', Boolean(mensaje));
    if (err) err.textContent = mensaje || '';
    return !mensaje;
  }

  const esCorreo = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

  function limpiarAlEscribir(campos) {
    campos.forEach(input => {
      input.addEventListener('input', () => marcar(input, ''));
    });
  }

  /*  2) SERVICIO AL CLIENTE */
  const formServicio = $('#formServicio');
  const sNombre = $('#sNombre'), sCorreo = $('#sCorreo'), sTel = $('#sTel'),
        sTipo = $('#sTipo'), sMensaje = $('#sMensaje');
  const contador = $('#contador');

  limpiarAlEscribir([sNombre, sCorreo, sTel, sMensaje]);

  sMensaje.addEventListener('input', () => {
    if (sMensaje.value.length > 400) sMensaje.value = sMensaje.value.slice(0, 400);
    contador.textContent = sMensaje.value.length;
  });

  formServicio.addEventListener('submit', e => {
    e.preventDefault();

    let ok = true;
    ok &= marcar(sNombre, sNombre.value.trim().length < 3 ? 'Escribe tu nombre completo.' : '');
    ok &= marcar(sCorreo, !esCorreo(sCorreo.value) ? 'Revisa el correo: falta el @ o el dominio.' : '');
    ok &= marcar(sTel, !/^[\d\s+()-]{7,}$/.test(sTel.value.trim()) ? 'Escribe un teléfono de al menos 7 dígitos.' : '');
    ok &= marcar(sMensaje, sMensaje.value.trim().length < 10 ? 'Cuéntanos un poco más (mínimo 10 caracteres).' : '');
    if (!ok) return;

    const boton = $('#btnEnviarServicio');
    boton.disabled = true;
    boton.textContent = 'Enviando…';

    setTimeout(() => {
      const ticket = 'HM-' + String(Math.floor(Math.random() * 9000) + 1000);
      $('#resumenServicio').innerHTML = `
        <div><span>Número de caso</span><strong>${ticket}</strong></div>
        <div><span>Solicitud</span><strong>${sTipo.value}</strong></div>
        <div><span>A nombre de</span><strong>${sNombre.value.trim()}</strong></div>
        <div><span>Respuesta a</span><strong>${sCorreo.value.trim()}</strong></div>`;

      $('#servicioFormulario').hidden = true;
      $('#servicioListo').hidden = false;
      boton.disabled = false;
      boton.textContent = 'Enviar solicitud';
      mostrarAviso('Caso ' + ticket + ' registrado');
    }, 900);
  });

  $('#otraSolicitud').addEventListener('click', () => {
    formServicio.reset();
    contador.textContent = '0';
    $$('.campo', formServicio).forEach(c => c.classList.remove('malo'));
    $$('.error', formServicio).forEach(c => (c.textContent = ''));
    $('#servicioListo').hidden = true;
    $('#servicioFormulario').hidden = false;
    sNombre.focus();
  });

  /*  3) PEDIDO, FACTURA Y PAGO  */
  const IVA = 0.19;
  const modalPedido = $('#modal-pedido');
  const productos = $$('#productos .producto');
  const errorProd = $('#errorProductos');
  const subtotalP1 = $('#subtotalPaso1');
  const pasosProgreso = $$('#progreso li');

  function leerCarrito() {
    return productos
      .map(p => {
        const input = $('input[type="checkbox"]', p);
        return {
          activo: input.checked,
          nombre: input.dataset.nombre,
          precio: Number(input.dataset.precio),
          cant: Number($('output', p).textContent)
        };
      })
      .filter(i => i.activo);
  }

  function calcular() {
    const items = leerCarrito();
    const subtotal = items.reduce((s, i) => s + i.precio * i.cant, 0);
    const envio = items.length ? Number($('#pCiudad').selectedOptions[0].dataset.envio) : 0;
    const iva = subtotal * IVA;
    return { items, subtotal, iva, envio, total: subtotal + iva + envio };
  }

  function refrescarSubtotal() {
    const { subtotal } = calcular();
    subtotalP1.textContent = pesos(subtotal);
    if (subtotal > 0) errorProd.textContent = '';
  }

  productos.forEach(p => {
    const input = $('input[type="checkbox"]', p);
    const salida = $('output', p);

    input.addEventListener('change', refrescarSubtotal);

    $$('.cant', p).forEach(b => {
      b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        let v = Number(salida.textContent) + Number(b.dataset.delta);
        v = Math.min(5, Math.max(1, v));
        salida.textContent = v;
        if (!input.checked) input.checked = true;
        refrescarSubtotal();
      });
    });
  });

  function seleccionarModelo(id) {
    productos.forEach(p => {
      const input = $('input[type="checkbox"]', p);
      input.checked = input.dataset.id === id;
    });
    irAPaso(1);
    refrescarSubtotal();
  }

  /* --- navegación entre pasos --- */
  function irAPaso(n) {
    $$('.paso', modalPedido).forEach(s => s.classList.toggle('activo', Number(s.dataset.paso) === n));
    pasosProgreso.forEach((li, i) => {
      li.classList.toggle('activo', i === n - 1);
      li.classList.toggle('listo', i < n - 1);
    });
    modalPedido.querySelector('.modal__caja').scrollTop = 0;
  }

  $$('[data-ir]', modalPedido).forEach(b => {
    b.addEventListener('click', () => {
      const destino = Number(b.dataset.ir);
      if (destino === 2 && calcular().subtotal === 0) {
        errorProd.textContent = 'Selecciona al menos un producto para continuar.';
        return;
      }
      irAPaso(destino);
    });
  });

  /* --- paso 2: datos y generación de factura --- */
  const pNombre = $('#pNombre'), pDoc = $('#pDoc'), pCorreo = $('#pCorreo'),
        pCiudad = $('#pCiudad'), pDir = $('#pDir');

  limpiarAlEscribir([pNombre, pDoc, pCorreo, pDir]);

  $('#formDatos').addEventListener('submit', e => {
    e.preventDefault();

    let ok = true;
    ok &= marcar(pNombre, pNombre.value.trim().length < 3 ? 'Escribe el nombre de quien factura.' : '');
    ok &= marcar(pDoc, !/^\d{6,12}$/.test(pDoc.value.trim()) ? 'El documento va entre 6 y 12 dígitos.' : '');
    ok &= marcar(pCorreo, !esCorreo(pCorreo.value) ? 'Necesitamos un correo válido para enviar la factura.' : '');
    ok &= marcar(pDir, pDir.value.trim().length < 6 ? 'Escribe la dirección de entrega.' : '');
    if (!ok) return;

    generarFactura();
    irAPaso(3);
  });

  let numeroFactura = '';

  function generarFactura() {
    const { items, subtotal, iva, envio, total } = calcular();
    const hoy = new Date();
    numeroFactura = 'FE-2026-' + String(Math.floor(Math.random() * 9000) + 1000);

    $('#facNumero').textContent = numeroFactura;
    $('#facFecha').textContent = hoy.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    $('#facCliente').innerHTML = `
      <span><strong>Cliente:</strong> ${pNombre.value.trim()} · CC/NIT ${pDoc.value.trim()}</span>
      <span><strong>Entrega:</strong> ${pDir.value.trim()}, ${pCiudad.value}</span>
      <span><strong>Correo:</strong> ${pCorreo.value.trim()}</span>`;

    $('#facItems').innerHTML = items.map(i => `
      <tr><td>${i.nombre}</td><td>${i.cant}</td><td>${pesos(i.precio * i.cant)}</td></tr>`).join('');

    $('#facSubtotal').textContent = pesos(subtotal);
    $('#facIva').textContent = pesos(iva);
    $('#facEnvio').textContent = envio === 0 ? 'Gratis' : pesos(envio);
    $('#facTotal').textContent = pesos(total);
  }

  pCiudad.addEventListener('change', () => {
    if ($('.paso[data-paso="3"]').classList.contains('activo')) generarFactura();
  });

  /* --- paso 4: pago --- */
  $('#btnPagar').addEventListener('click', () => {
    const medio = $('input[name="pago"]:checked').value;
    const { total } = calcular();

    irAPaso(4);
    $('#pagoProcesando').hidden = false;
    $('#pagoListo').hidden = true;

    setTimeout(() => {
      $('#pagoProcesando').hidden = true;
      $('#pagoListo').hidden = false;

      const aprobacion = 'AP' + Math.floor(Math.random() * 900000 + 100000);
      const entrega = new Date(Date.now() + 5 * 86400000)
        .toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

      $('#resumenPago').innerHTML = `
        <div><span>Factura</span><strong>${numeroFactura}</strong></div>
        <div><span>Total pagado</span><strong>${pesos(total)}</strong></div>
        <div><span>Medio de pago</span><strong>${medio}</strong></div>
        <div><span>Autorización</span><strong>${aprobacion}</strong></div>
        <div><span>Entrega estimada</span><strong>${entrega}</strong></div>`;

      mostrarAviso('Pago aprobado · ' + numeroFactura);
    }, 2200);
  });

  $('#btnImprimir').addEventListener('click', () => window.print());

  $('#btnNuevoPedido').addEventListener('click', () => {
    $('#formDatos').reset();
    $$('.campo', modalPedido).forEach(c => c.classList.remove('malo'));
    $$('.error', modalPedido).forEach(c => (c.textContent = ''));
    productos.forEach((p, i) => {
      $('input[type="checkbox"]', p).checked = i === 0;
      $('output', p).textContent = '1';
    });
    refrescarSubtotal();
    irAPaso(1);
  });

  refrescarSubtotal();

  /*  APARICIÓN DE SECCIONES AL DESPLAZARSE */
  const observados = $$('.ficha, .tarjeta, .plan, .ficha__img, .cta__caja');
  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !menosMovimiento) {
    observados.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.2,.7,.3,1)';
    });
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en, i) => {
        if (!en.isIntersecting) return;
        setTimeout(() => {
          en.target.style.opacity = '1';
          en.target.style.transform = 'none';
        }, i * 70);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    observados.forEach(el => obs.observe(el));
  }
})();
