import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";

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

      // ---------------- GENERAR PDF ----------------
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text("CompuDiego", 105, 20, { align: "center" });

      pdf.setFontSize(16);
      pdf.text(`Registro de equipo ID: ${newId}`, 15, 40);
      pdf.setFontSize(12);
      pdf.text(`Cliente: ${data.clienteNombre}`, 15, 50);
      pdf.text(`DNI: ${data.clienteDNI}`, 15, 60);
      pdf.text(`Teléfono: ${data.clienteTelefono}`, 15, 70);
      pdf.text(`Equipo: ${data.equipoTipo} ${data.equipoMarca} ${data.equipoModelo}`, 15, 80);
      pdf.text(`SN: ${data.equipoSN}`, 15, 90);
      pdf.text(`Falla: ${data.equipoFalla}`, 15, 100);
      pdf.text(`Observaciones: ${data.equipoObs}`, 15, 110);

      pdf.save(`equipo_${newId}.pdf`);

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

  // ---------------- CARGAR INGRESOS POR MES ----------------
  async function cargarIngresos() {
    tablaIngresos.clear();
    const snapshot = await getDocs(colpresupuestos);
    const meses = {};

    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaPresupuesto?.toDate ? d.fechaPresupuesto.toDate() : new Date();
      const mesAnio = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!meses[mesAnio]) meses[mesAnio] = 0;
      meses[mesAnio] += d.precioFinal || 0;
    });

    Object.keys(meses).sort((a,b) => new Date(a) - new Date(b)).forEach(mes => {
      tablaIngresos.row.add([mes, meses[mes].toFixed(2)]);
    });
    tablaIngresos.draw();
  }

  // ---------------- INICIALIZAR ----------------
  cargarEquipos();
  cargarPresupuestos();
  cargarIngresos();

});
