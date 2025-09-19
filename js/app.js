import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

document.addEventListener('DOMContentLoaded', async () => {

  // Configuración de Firebase
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

  // Colecciones
  const colequipos = collection(db, 'equipos');
  const colpresupuestos = collection(db, 'presupuestos');
  const counterDocRef = doc(db, 'counters', 'equiposCounter'); // Documento para el contador de IDs propios

  // DataTables
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();
  const tablaIngresos = $('#tablaIngresos').length ? $('#tablaIngresos').DataTable() : null;

  // ----------------- FUNCIONES -----------------
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

  async function cargarIngresos() {
    if (!tablaIngresos) return;

    tablaIngresos.clear();
    const snapshot = await getDocs(colpresupuestos);
    const ingresosPorMes = {};

    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      const total = parseFloat(d.precioFinal) || 0;
      ingresosPorMes[mesAnio] = (ingresosPorMes[mesAnio] || 0) + total;
    });

    for (const [mes, total] of Object.entries(ingresosPorMes)) {
      tablaIngresos.row.add([mes, total.toFixed(2)]);
    }
    tablaIngresos.draw();
  }

  function generarPDF(equipoData) {
    const { idPropio, clienteNombre, equipoTipo, equipoMarca, equipoModelo, equipoSN, equipoFalla } = equipoData;

    const doc = new jsPDF.jsPDF();

    const img = new Image();
    img.src = '../img/logo.jpg'; // ruta relativa correcta
    img.onload = () => {
      doc.addImage(img, 'JPEG', 60, 10, 90, 20); // ajusta tamaño del logo
      doc.setFontSize(14);
      doc.text(`ID Equipo: ${idPropio}`, 20, 50);
      doc.text(`Cliente: ${clienteNombre}`, 20, 60);
      doc.text(`Tipo: ${equipoTipo}`, 20, 70);
      doc.text(`Marca: ${equipoMarca}`, 20, 80);
      doc.text(`Modelo: ${equipoModelo}`, 20, 90);
      doc.text(`SN: ${equipoSN}`, 20, 100);
      doc.text(`Falla: ${equipoFalla}`, 20, 110);

      doc.save(`equipo_${idPropio}.pdf`);
    };
  }

  // ----------------- REGISTRAR EQUIPO -----------------
  const formEquipo = document.getElementById('formEquipo');
  const mensajeId = document.getElementById('mensajeId');

  formEquipo.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener último ID propio
    let lastId = 1999;
    const counterSnap = await getDoc(counterDocRef);
    if (counterSnap.exists()) lastId = counterSnap.data().lastId;

    const newId = lastId + 1;

    // Guardar equipo
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
      generarPDF(data); // genera PDF automáticamente
    } catch (error) {
      console.error("Error al registrar equipo:", error);
      alert("Ocurrió un error al registrar el equipo.");
    }
  });

  // ----------------- REGISTRAR PRESUPUESTO -----------------
  const formPresupuesto = document.getElementById('formPresupuesto');
  const mensajePresupuesto = document.getElementById('mensajePresupuesto');

  formPresupuesto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const equipoId = document.getElementById('presupuestoEquipoId').value.trim();
    if (!equipoId) return alert("Debe ingresar un ID de equipo válido");

    const pres = {
      equipoId,
      reparacion: document.getElementById('presupuestoReparacion').value,
      repuestos: document.getElementById('presupuestoRepuestos').value,
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

  // ----------------- INICIALIZAR -----------------
  cargarEquipos();
  cargarPresupuestos();
  cargarIngresos();

});
