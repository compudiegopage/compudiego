import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

  // ----------------- Firebase -----------------
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

  const colequipos = collection(db, 'equipos');
  const colpresupuestos = collection(db, 'presupuestos');
  const counterDocRef = doc(db, 'counters', 'equiposCounter'); // contador de IDs propios

  // ----------------- DataTables -----------------
  const tablaEquipos = $('#tablaEquipos').DataTable();
  const tablaPresupuestos = $('#tablaPresupuestos').DataTable();

  // ----------------- Registrar Equipo -----------------
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

  // ----------------- Cargar Equipos -----------------
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

  // ----------------- Registrar Presupuesto -----------------
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
      actualizarIngresos();
    } catch (error) {
      console.error("Error al registrar presupuesto:", error);
      alert("Ocurrió un error al registrar el presupuesto.");
    }
  });

  // ----------------- Cargar Presupuestos -----------------
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

  // ----------------- Ingresos -----------------
  const ctx = document.getElementById('chartIngresos').getContext('2d');
  const chartIngresos = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Ingresos', data: [], backgroundColor: '#007bff' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  async function actualizarIngresos() {
    const snapshot = await getDocs(colpresupuestos);
    const labels = [];
    const data = [];
    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate().toLocaleDateString() : '';
      labels.push(fecha);
      data.push(d.precioFinal || 0);
    });
    chartIngresos.data.labels = labels;
    chartIngresos.data.datasets[0].data = data;
    chartIngresos.update();
  }

  document.getElementById('btnRefrescarIngresos').addEventListener('click', actualizarIngresos);

  // ----------------- Generar PDF -----------------
  const btnPdf = document.createElement('button');
  btnPdf.textContent = 'Generar PDF';
  btnPdf.className = 'btn btn-outline-dark mb-3';
  document.querySelector('#consultas .card-body').prepend(btnPdf);

  btnPdf.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Logo
    const img = new Image();
    img.src = 'img/logo.jpg';
    img.onload = () => {
      const imgWidth = 180;
      const imgHeight = (img.height / img.width) * imgWidth;
      doc.addImage(img, 'JPEG', 15, 10, imgWidth, imgHeight);

      // Título
      doc.setFontSize(16);
      doc.text('Presupuestos Registrados', 105, imgHeight + 25, { align: 'center' });

      // Tabla
      let y = imgHeight + 35;
      tablaPresupuestos.rows().every(function () {
        const row = this.data();
        doc.setFontSize(10);
        doc.text(row.join(' | '), 10, y);
        y += 7;
        if (y > 280) { doc.addPage(); y = 10; }
      });

      doc.save('presupuestos.pdf');
    };
  });

  // ----------------- Inicializar -----------------
  cargarEquipos();
  cargarPresupuestos();
  actualizarIngresos();

});
