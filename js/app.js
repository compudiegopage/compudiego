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

  // ---------------- COLECCIONES ----------------
  const colequipos = collection(db, 'equipos');
  const colpresupuestos = collection(db, 'presupuestos');
  const colventas = collection(db, 'ventas'); // ventas
  const counterDocRef = doc(db, 'counters', 'equiposCounter');

  // ---------------- DATATABLES ----------------
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();
  const tablaIngresos = $('#tablaIngresos').DataTable({
    columns: [
      { title: "Mes" },
      { title: "Ingresos" }
    ]
  });

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
      img.src = '../img/logo.jpg';
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

        // --- CUADRO CON DATOS DEL CLIENTE Y EQUIPO ---
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

        // Guardar PDF
        pdf.save(`equipo_${newId}.pdf`);
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

  // ---------------- CARGAR INGRESOS POR MES ----------------
  async function cargarIngresos() {
    tablaIngresos.clear();
    const meses = {};

    // Presupuestos
    const snapshotPres = await getDocs(colpresupuestos);
    snapshotPres.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!mes
