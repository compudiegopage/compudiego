import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

document.addEventListener('DOMContentLoaded', async () => {

  // ---------------- CONFIGURACIÓN FIREBASE ----------------
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
  const counterDocRef = doc(db, 'counters', 'equiposCounter'); // contador ID propio

  // ---------------- DATATABLES ----------------
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();

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
      const docRef = await addDoc(colpresupuestos, pres);
      mensajePresupuesto.textContent = 'Presupuesto registrado ID: ' + docRef.id;
      alert('Presupuesto registrado ID: ' + docRef.id);
      formPresupuesto.reset();
      cargarPresupuestos();
      generarPDF(pres, docRef.id);
      actualizarIngresos();
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

  // ---------------- GENERAR PDF ----------------
  async function generarPDF(presupuesto, docId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Logo
    const img = new Image();
    img.src = 'img/logo.jpg';
    img.onload = () => {
      doc.addImage(img, 'JPEG', 60, 10, 90, 30);

      // Texto presupuesto
      doc.setFontSize(12);
      doc.text(`Presupuesto ID: ${docId}`, 10, 50);
      doc.text(`Equipo ID: ${presupuesto.equipoId}`, 10, 60);
      doc.text(`Reparación: ${presupuesto.reparacion}`, 10, 70);
      doc.text(`Repuestos: ${presupuesto.repuestos}`, 10, 80);
      doc.text(`Gastos: $${presupuesto.gastos.toFixed(2)}`, 10, 90);
      doc.text(`Precio final: $${presupuesto.precioFinal.toFixed(2)}`, 10, 100);

      doc.save(`Presupuesto_${presupuesto.equipoId}.pdf`);
    };
  }

  // ---------------- INGRESOS ----------------
  const ctxIngresos = document.getElementById('chartIngresos').getContext('2d');
  let chartIngresos = new Chart(ctxIngresos, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Ingresos', data: [], backgroundColor: '#f1c40f' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  async function actualizarIngresos() {
    const snapshot = await getDocs(colpresupuestos);
    const ingresosPorFecha = {};

    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate().toLocaleDateString() : '';
      if (!ingresosPorFecha[fecha]) ingresosPorFecha[fecha] = 0;
      ingresosPorFecha[fecha] += d.precioFinal || 0;
    });

    chartIngresos.data.labels = Object.keys(ingresosPorFecha);
    chartIngresos.data.datasets[0].data = Object.values(ingresosPorFecha);
    chartIngresos.update();
  }

  document.getElementById('btnRefrescarIngresos').addEventListener('click', actualizarIngresos);

  // ---------------- INICIALIZAR ----------------
  cargarEquipos();
  cargarPresupuestos();
  actualizarIngresos();

});
