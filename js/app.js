import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// -------------------- CONTROL DE ACCESO --------------------

// Token secreto
const SECRET_TOKEN = "17420820Compudiego";

// Función para verificar acceso
function verificarAcceso() {
  // Revisamos si ya tenemos acceso guardado en localStorage
  if (localStorage.getItem('adminAccess') === 'true') {
    // Acceso ya concedido, ocultamos token de la URL
    window.history.replaceState({}, document.title, "/administracion");
    return true;
  }

  // Revisamos si viene token en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token === SECRET_TOKEN) {
    // Guardamos acceso para futuras visitas
    localStorage.setItem('adminAccess', 'true');
    // Limpiamos la URL para que no quede visible
    window.history.replaceState({}, document.title, "/administracion");
    return true;
  }

  // Si no hay token válido, bloqueamos acceso
  document.body.innerHTML = "<h2>Acceso denegado</h2>";
  return false;
}

// Llamamos a la función al cargar la página
if (verificarAcceso()) {
  // Aquí va tu código de administración normal
  console.log("Acceso autorizado. Mostrando contenido.");
  // TODO: tu JS de Firebase, tablas, formularios, etc.
}

const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', async () => {

  // ---------------- CONFIG FIREBASE ----------------
  const firebaseConfig = {
    apiKey: "AIzaSyBgbBA28SKFqMU4ZePCKq8Cr7PvUKdd5AA",
    authDomain: "adminwebcd.firebaseapp.com",
    projectId: "adminwebcd",
    storageBucket: "adminwebcd.firebasestorage.app",
    messagingSenderId: "640889361329",
    appId: "1:640889361329:web:aebd60000a99ff93a06390",
    measurementId: "G-CLZ4NNCCHQ"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // colecciones firebase
  const colequipos = collection(db, 'equipos');
  const colpresupuestos = collection(db, 'presupuestos');
  const colventas = collection(db, 'ventas');
  const colcamaras = collection(db, 'camaras');
  const counterDocRef = doc(db, 'counters', 'equiposCounter');

  // data tables
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaVentas = $('#tablaVentas').DataTable();

  const tablaPresupuestos = $('#tablaPresupuestos').DataTable({
    columns: [
      { title: "Cliente" },
      { title: "Fecha" },
      { title: "ID" },
      { title: "Reparación" },
      { title: "Repuestos" },
      { title: "Gastos" },
      { title: "Precio Final" }
    ]
  });
  const tablaIngresos = $('#tablaIngresos').DataTable({
    columns: [
      { title: "Mes" },
      { title: "Ingresos" }
    ]
  });
  const tablaCamaras = $('#tablaCamaras').DataTable();

  // ---------------- REGISTRAR EQUIPO ----------------
  const formEquipo = document.getElementById('formEquipo');
  const mensajeId = document.getElementById('mensajeId');

  formEquipo.addEventListener('submit', async (e) => {
    e.preventDefault();

    let lastId = 1999;
    const counterSnap = await getDoc(counterDocRef);
    if (counterSnap.exists()) lastId = counterSnap.data().lastId;

    const newId = lastId + 1;

    const data = {
      idPropio: newId,
      clienteNombre: document.getElementById('clienteNombre').value,
      clienteDNI: document.getElementById('clienteDNI').value,
      clienteTelefono: document.getElementById('clienteTelefono').value,
      equipoTipo: document.getElementById('equipoTipo').value,
      equipoMarca: document.getElementById('equipoMarca').value,
      equipoModelo: document.getElementById('equipoModelo').value,
      equipoSN: document.getElementById('equipoSN').value,
      equipoObs: document.getElementById('equipoObs').value,
      equipoFalla: document.getElementById('equipoFalla').value,
      fechaIngreso: serverTimestamp()
    };

    try {
      await addDoc(colequipos, data);
      await setDoc(counterDocRef, { lastId: newId });

      mensajeId.textContent = 'Equipo registrado con ID: ' + newId;
      alert('Equipo registrado con ID: ' + newId);
      formEquipo.reset();
      cargarEquipos();
// ---------------- GENERAR PDF PROFESIONAL ----------------
const pdf = new jsPDF();

// --- ENCABEZADO ---
pdf.setFontSize(11); // un poco más grande
pdf.setFont("helvetica", "bold");
const headerText = [
  "Ingeniero Luparello Diego Ezequiel",
  "Celular: +54 9 11 50186664 - compu.diego94@gmail.com",
  "CUIT: 20382284578 - Domicilio: Calle 202 252, Berazategui, CP: 1884",
  "Actividad AFIP: Servicios de informática N.C.P."
];
let yHeader = 10;
headerText.forEach(line => {
  pdf.text(line, 105, yHeader, { align: "center" });
  yHeader += 5;
});

pdf.setLineWidth(0.5);
pdf.line(15, yHeader, 195, yHeader);
yHeader += 10;

// --- LOGO ---
const img = new Image();
img.src = 'img/Logo2.jpg';
img.onload = () => {
  const imgWidth = 90;
  const imgHeight = (img.height * imgWidth) / img.width;
  pdf.addImage(img, 'JPEG', (210 - imgWidth) / 2, yHeader, imgWidth, imgHeight);

  let yBody = yHeader + imgHeight + 10;

  // --- FECHA ---
  const fechaActual = new Date();
  const fechaStr = fechaActual.toLocaleDateString('es-AR');
  pdf.setFontSize(10);
  pdf.text(`Fecha: ${fechaStr}`, 195, yBody, { align: "right" });

  // CUADRO DATOS CLIENTE
  yBody += 10;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.rect(15, yBody, 180, 80);

  let yData = yBody + 10;
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Datos del Cliente y Equipo", 105, yData, { align: "center" });
  yData += 10;

  pdf.setFont("helvetica", "normal");
  pdf.text(`Cliente: ${data.clienteNombre}`, 20, yData);
  yData += 8;
  pdf.text(`DNI: ${data.clienteDNI}`, 20, yData);
  yData += 8;
  pdf.text(`Teléfono: ${data.clienteTelefono}`, 20, yData);
  yData += 8;
  pdf.text(`Equipo: ${data.equipoTipo} ${data.equipoMarca} ${data.equipoModelo}`, 20, yData);
  yData += 8;
  pdf.text(`SN: ${data.equipoSN}`, 20, yData);
  yData += 8;
  pdf.text(`Falla: ${data.equipoFalla}`, 20, yData);
  yData += 8;
  pdf.text(`Observaciones: ${data.equipoObs}`, 20, yData);

  // --- TEXTO LEGAL / PROFESIONAL ---
  let yLegal = yBody + 100; // Ajusta según espacio disponible
  pdf.setFontSize(11); // un poco más grande
  pdf.setFont("helvetica", "normal");

  const textoLegal = [
    "El equipo objeto de este documento deberá ser retirado dentro de los 90 días de notificada su reparación.",
    " ",
    "Transcurrido este plazo, el cliente acepta la pérdida de derecho sobre el equipo, pudiendo la empresa disponer del mismo según su criterio.",
    "",
    "Al recibir este documento, el cliente acepta los términos y condiciones aquí especificados, incluyendo plazos de retiro, forma de pago y garantías.",
    "",
    "Para consultas sobre el estado de la reparación, el cliente puede contactarse al número o correo indicado en este documento.",
    " ",
    "Se recomienda guardar este PDF como comprobante.",
    "",
    "Gracias por confiar en nuestros servicios. Nos esforzamos por brindar atención profesional, rápida y confiable. ¡Esperamos que su experiencia sea satisfactoria!"
  ];

  const margenIzq = 15;
  const anchoMax = 180; // para que no se salga del margen derecho
  textoLegal.forEach((line, index) => {
    pdf.text(line, margenIzq, yLegal + index * 6, { maxWidth: anchoMax });
  });

  // --- GUARDAR PDF CON NOMBRE DEL CLIENTE ---
  const nombreArchivo = `Equipo_${data.clienteNombre.replace(/ /g, "_")}_${newId}.pdf`;
  pdf.save(nombreArchivo);
};


    } catch (error) {
      console.error("Error al registrar equipo:", error);
      alert("Ocurrió un error al registrar el equipo.");
    }
  });

  // ---------------- CARGAR EQUIPOS ----------------
  async function cargarEquipos() {
    tablaEquipos.clear();
    const q = query(colequipos, orderBy('fechaIngreso'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaIngreso?.toDate ? d.fechaIngreso.toDate().toLocaleString() : '';
      tablaEquipos.row.add([
        d.idPropio || docu.id,
        fecha,
        d.clienteNombre,
        d.clienteDNI,
        d.clienteTelefono,
        d.equipoTipo,
        d.equipoMarca,
        d.equipoModelo,
        d.equipoSN,
        d.equipoFalla
      ]);
    });
    tablaEquipos.draw();
  }

  // ---------------- REGISTRAR PRESUPUESTO ----------------
  const formPresupuesto = document.getElementById('formPresupuesto');
  const mensajePresupuesto = document.getElementById('mensajePresupuesto');

  formPresupuesto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const equipoId = document.getElementById('presupuestoEquipoId').value.trim();
    if (!equipoId) return alert("Debe ingresar un ID de equipo válido");

    const pres = {
      equipoId,
      reparacion: document.getElementById('presupuestoReparacion').value.trim(),
      repuestos: document.getElementById('presupuestoRepuestos').value.trim(),
      gastos: parseFloat(document.getElementById('presupuestoGastos').value) || 0,
      precioFinal: parseFloat(document.getElementById('presupuestoPrecioFinal').value) || 0,
      fechaPresupuesto: serverTimestamp()
    };

    try {
      await addDoc(colpresupuestos, pres);
      mensajePresupuesto.textContent = 'Presupuesto registrado ID: ' + equipoId;
      alert('Presupuesto registrado ID: ' + equipoId);
      formPresupuesto.reset();
      cargarPresupuestos();
      cargarIngresos();
    } catch (error) {
      console.error("Error al registrar presupuesto:", error);
      alert("Ocurrió un error al registrar el presupuesto.");
    }
  });

  // ---------------- CARGAR PRESUPUESTOS ----------------
  async function cargarPresupuestos() {
    tablaPresupuestos.clear();
    const q = query(colpresupuestos, orderBy('fechaPresupuesto'));
    const snapshot = await getDocs(q);

    for (const docu of snapshot.docs) {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate().toLocaleString() : '';

      // Obtener nombre del cliente
      let clienteNombre = '';
      if (d.equipoId) {
        const equipoRef = query(colequipos, orderBy('idPropio'));
        const equiposSnap = await getDocs(colequipos);
        const equipoDoc = equiposSnap.docs.find(e => e.data().idPropio == d.equipoId);
        if (equipoDoc) clienteNombre = equipoDoc.data().clienteNombre;
      }

      tablaPresupuestos.row.add([
        clienteNombre,
        fecha,
        d.equipoId,
        d.reparacion,
        d.repuestos,
        d.gastos,
        d.precioFinal
      ]);
    }

    tablaPresupuestos.draw();
  }

  // ---------------- REGISTRAR VENTA ----------------
  const formVenta = document.getElementById('formVenta');
  const mensajeVenta = document.getElementById('mensajeVenta');

  formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    const venta = {
      clienteNombre: document.getElementById('ventaClienteNombre').value,
      clienteDNI: document.getElementById('ventaClienteDNI').value,
      clienteTelefono: document.getElementById('ventaClienteTelefono').value,
      productoVendido: document.getElementById('ventaProducto').value,
      gasto: parseFloat(document.getElementById('ventaGasto').value) || 0,
      precio: parseFloat(document.getElementById('ventaPrecio').value) || 0,
      fechaVenta: serverTimestamp()
    };

    try {
      await addDoc(colventas, venta);
      mensajeVenta.textContent = `Venta registrada: ${venta.productoVendido}`;
      alert(`Venta registrada: ${venta.productoVendido}`);
      formVenta.reset();
      cargarIngresos();
    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert("Ocurrió un error al registrar la venta.");
    }
  });

  // ---------------- REGISTRAR CAMARAS ----------------
  const formCamara = document.getElementById('formCamara');
  const mensajeCamara = document.getElementById('mensajeCamara');

  formCamara.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cam = {
      clienteNombre: document.getElementById('camaraClienteNombre').value,
      clienteDNI: document.getElementById('camaraClienteDNI').value,
      clienteTelefono: document.getElementById('camaraClienteTelefono').value,
      cantidad: parseInt(document.getElementById('camaraCantidad').value) || 0,
      marca: document.getElementById('camaraMarca').value,
      observaciones: document.getElementById('camaraObservaciones').value,
      gastos: parseFloat(document.getElementById('camaraGasto').value) || 0,
      precio: parseFloat(document.getElementById('camaraPrecio').value) || 0,
      fechaRegistro: serverTimestamp()
    };

    try {
      await addDoc(colcamaras, cam);
      mensajeCamara.textContent = `Registro de cámaras guardado`;
      alert(`Registro de cámaras guardado`);
      formCamara.reset();
      cargarCamaras();
      cargarIngresos();
    } catch (error) {
      console.error("Error al registrar camaras:", error);
      alert("Ocurrió un error al registrar las cámaras.");
    }
  });

  // ---------------- CARGAR CAMARAS ----------------
  async function cargarCamaras() {
    tablaCamaras.clear();
    const q = query(colcamaras, orderBy('fechaRegistro'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const c = docu.data();
      const fecha = c.fechaRegistro?.toDate ? c.fechaRegistro.toDate().toLocaleString() : '';
      tablaCamaras.row.add([
        fecha,
        c.clienteNombre,
        c.clienteDNI,
        c.clienteTelefono,
        c.cantidad,
        c.marca,
        c.observaciones,
        c.gastos,
        c.precio
      ]);
    });
    tablaCamaras.draw();
  }
  // ---------------- CARGAR VENTAS ----------------
  async function cargarVentas() {
    tablaVentas.clear();
    const q = query(colventas, orderBy('fechaVenta'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const c = docu.data();
      const fecha = c.fechaVenta?.toDate ? c.fechaVenta.toDate().toLocaleString() : '';
      tablaVentas.row.add([
        fecha,
        c.clienteNombre,
        c.clienteDNI,
        c.clienteTelefono,
        c.productoVendido,
        c.gasto,
        c.precio
      ]);
    });
    tablaVentas.draw();
  }
  // ---------------- CARGAR INGRESOS ----------------
  async function cargarIngresos() {
    tablaIngresos.clear();
    const meses = {};

    // Presupuestos
    const snapshotPres = await getDocs(colpresupuestos);
    snapshotPres.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!meses[mesAnio]) meses[mesAnio] = 0;
      meses[mesAnio] += d.precioFinal || 0;
    });

    // Ventas
    const snapshotVentas = await getDocs(colventas);
    snapshotVentas.forEach(docu => {
      const v = docu.data();
      const fecha = v.fechaVenta?.toDate ? v.fechaVenta.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!meses[mesAnio]) meses[mesAnio] = 0;
      meses[mesAnio] += (v.precio - v.gasto) || 0;
    });

    // Cámaras
    const snapshotCams = await getDocs(colcamaras);
    snapshotCams.forEach(docu => {
      const c = docu.data();
      const fecha = c.fechaRegistro?.toDate ? c.fechaRegistro.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!meses[mesAnio]) meses[mesAnio] = 0;
      meses[mesAnio] += (c.precio - c.gastos) || 0;
    });

    Object.keys(meses)
  .sort((a, b) => new Date(a) - new Date(b))
  .forEach(mes => {
    const valorFormateado = '$ ' + Math.round(meses[mes]).toLocaleString('es-AR');
    tablaIngresos.row.add([mes, valorFormateado]);
  });
tablaIngresos.draw();

  }

  // ---------------- INICIALIZAR ----------------
  cargarEquipos();
  cargarPresupuestos();
  cargarIngresos();
  cargarCamaras();
  cargarVentas();

  // Botón Adrián
  const btnAdrian = document.getElementById('btnAdrian');
  if (btnAdrian) {
    btnAdrian.addEventListener('click', () => {
      document.getElementById('clienteNombre').value = 'Adrian Fernandez';
      document.getElementById('clienteDNI').value = '24515800';
      document.getElementById('clienteTelefono').value = '+54 9 11 6993-7052';

      mensajeId.textContent = 'Cliente Adrian cargado. Complete el resto.';
      setTimeout(() => mensajeId.textContent = '', 3000);
    });
  }

});
