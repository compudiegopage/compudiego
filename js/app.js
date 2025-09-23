import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
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
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();
  const tablaIngresos = $('#tablaIngresos').DataTable({
    columns: [
      { title: "Mes" },
      { title: "Ingresos" }
    ]
  });
  const tablaCamaras = $('#tablaCamaras').DataTable();

  // registrar equipo
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

      // --- ENCABEZADO CENTRADO ---
      pdf.setFontSize(10);
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

      // --- LOGO CENTRADO ---
      const img = new Image();
      img.src = 'img/Logo.jpg';
      img.onload = () => {
        const imgWidth = 60;
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(img, 'JPEG', (210 - imgWidth) / 2, yHeader, imgWidth, imgHeight);

        let yBody = yHeader + imgHeight + 10;

        // --- FECHA ABAJO A LA DERECHA ---
        const fechaActual = new Date();
        const fechaStr = fechaActual.toLocaleDateString('es-AR');
        pdf.setFontSize(10);
        pdf.text(`Fecha: ${fechaStr}`, 195, yBody, { align: "right" });

        // CUADRO CON DATOS DEL CLIENTE Y EQUIPO 
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

        pdf.save(`equipo_${newId}.pdf`);
      };

    } catch (error) {
      console.error("Error al registrar equipo:", error);
      alert("Ocurrió un error al registrar el equipo.");
    }
  });

  // cargar equipos
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

  // registrar presupuesto
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

  // cargar presupuesto
  async function cargarPresupuestos() {
    tablaPresupuestos.clear();
    const q = query(colpresupuestos, orderBy('fechaPresupuesto'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate().toLocaleString() : '';
      tablaPresupuestos.row.add([
        docu.id,
        d.equipoId,
        fecha,
        d.reparacion,
        d.repuestos,
        d.gastos,
        d.precioFinal
      ]);
    });
    tablaPresupuestos.draw();
  }

  // registrar venta
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

  // registrar camaras
  const formCamara = document.getElementById('formCamara');
  const mensajeCamara = document.getElementById('mensajeCamara');

  formCamara.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cam = {
      clienteNombre: document.getElementById('camaraNombre').value,
      clienteDNI: document.getElementById('camaraDNI').value,
      clienteTelefono: document.getElementById('camaraTelefono').value,
      cantidad: parseInt(document.getElementById('camaraCantidad').value) || 0,
      marca: document.getElementById('camaraMarca').value,
      gastos: parseFloat(document.getElementById('camaraGastos').value) || 0,
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

  // cargar camaras
  async function cargarCamaras() {
    tablaCamaras.clear();
    const q = query(colcamaras, orderBy('fechaRegistro'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const c = docu.data();
      const fecha = c.fechaRegistro?.toDate ? c.fechaRegistro.toDate().toLocaleString() : '';
      tablaCamaras.row.add([
        docu.id,
        fecha,
        c.clienteNombre,
        c.clienteDNI,
        c.clienteTelefono,
        c.cantidad,
        c.marca,
        c.gastos,
        c.precio
      ]);
    });
    tablaCamaras.draw();
  }

  // cargar ingresos por mes
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

    // Agregar al DataTable
    Object.keys(meses).sort((a,b) => new Date(a) - new Date(b)).forEach(mes => {
      tablaIngresos.row.add([mes, meses[mes].toFixed(2)]);
    });
    tablaIngresos.draw();
  }

  // ---------------- INICIALIZAR ----------------
  cargarEquipos();
  cargarPresupuestos();
  cargarIngresos();
  cargarCamaras();

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
