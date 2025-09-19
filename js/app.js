import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";

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
  const counterDocRef = doc(db, 'counters', 'equiposCounter');

  // ---------------- DATATABLES ----------------
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();
  const tablaIngresos = $('#tablaIngresos') ? $('#tablaIngresos').DataTable() : null;

  // ---------------- REGISTRAR EQUIPO ----------------
  const formEquipo = document.getElementById('formEquipo');
  const mensajeId = document.getElementById('mensajeId');

  formEquipo.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener último ID propio
    let lastId = 1999;
    const counterSnap = await getDoc(counterDocRef);
    if (counterSnap.exists()) lastId = counterSnap.data().lastId;

    const newId = lastId + 1;

    // Guardar nuevo equipo
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
      generarPDF(data); // Generar PDF automáticamente al registrar
      cargarIngresos(); // actualizar ingresos
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
      reparacion: document.getElementById('presupuestoReparacion').value,
      repuestos: document.getElementById('presupuestoRepuestos').value,
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
      cargarIngresos(); // actualizar ingresos
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
  function generarPDF(equipo) {
    const doc = new jsPDF();
    // Logo
    const img = new Image();
    img.src = "../img/logo.jpg";
    img.onload = () => {
      doc.addImage(img, "JPEG", 60, 10, 90, 20); // centrado arriba
      doc.setFontSize(14);
      doc.text(`Equipo ID: ${equipo.idPropio}`, 20, 50);
      doc.text(`Cliente: ${equipo.clienteNombre}`, 20, 60);
      doc.text(`DNI: ${equipo.clienteDNI}`, 20, 70);
      doc.text(`Tel: ${equipo.clienteTelefono}`, 20, 80);
      doc.text(`Tipo: ${equipo.equipoTipo}`, 20, 90);
      doc.text(`Marca: ${equipo.equipoMarca}`, 20, 100);
      doc.text(`Modelo: ${equipo.equipoModelo}`, 20, 110);
      doc.text(`SN: ${equipo.equipoSN}`, 20, 120);
      doc.text(`Falla: ${equipo.equipoFalla}`, 20, 130);
      doc.save(`Equipo_${equipo.idPropio}.pdf`);
    };
  }

  // ---------------- INGRESOS POR MES ----------------
  async function cargarIngresos() {
    if (!$('#tablaIngresos').length) return;
    const ingresosPorMes = {};

    const snapshot = await getDocs(colpresupuestos);
    snapshot.forEach(docu => {
      const d = docu.data();
      if (!d.fechaPresupuesto?.toDate) return;
      const fecha = d.fechaPresupuesto.toDate();
      const month = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      ingresosPorMes[month] = (ingresosPorMes[month] || 0) + (d.precioFinal || 0);
    });

    // Crear DataTable si no existe
    if (!tablaIngresos) {
      $('#tablaIngresos').DataTable({
        data: Object.entries(ingresosPorMes).map(([mes, total]) => [mes, total.toFixed(2)]),
        columns: [
          { title: "Mes" },
          { title: "Ingresos" }
        ]
      });
    } else {
      tablaIngresos.clear();
      Object.entries(ingresosPorMes).forEach(([mes, total]) => {
        tablaIngresos.row.add([mes, total.toFixed(2)]);
      });
      tablaIngresos.draw();
    }
  }

  // ---------------- INICIALIZAR ----------------
  cargarEquipos();
  cargarPresupuestos();
  cargarIngresos();

});
