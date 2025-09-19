import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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

  // ----------------- REGISTRAR EQUIPO -----------------
  const formEquipo = document.getElementById('formEquipo');
  const mensajeId = document.getElementById('mensajeId');

  formEquipo.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1️⃣ Obtener el último ID propio
    let lastId = 1999; // valor inicial si no existe
    const counterSnap = await getDoc(counterDocRef);
    if (counterSnap.exists()) {
      lastId = counterSnap.data().lastId;
    }

    const newId = lastId + 1; // ID para el nuevo equipo

    // 2️⃣ Guardar nuevo equipo con ID propio
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

      // 3️⃣ Actualizar el contador en Firestore
      await setDoc(counterDocRef, { lastId: newId });

      // 4️⃣ Mostrar mensaje con ID propio
      mensajeId.textContent = 'Equipo registrado con ID: ' + newId;
      alert('Equipo registrado con ID: ' + newId);

      formEquipo.reset();
      cargarEquipos();
    } catch (error) {
      console.error("Error al registrar equipo:", error);
      alert("Ocurrió un error al registrar el equipo.");
    }
  });

  // ----------------- CARGAR EQUIPOS -----------------
  async function cargarEquipos() {
    tablaEquipos.clear();
    const q = query(colequipos, orderBy('fechaIngreso'));
    const snapshot = await getDocs(q);
    snapshot.forEach(docu => {
      const d = docu.data();
      const fecha = d.fechaIngreso?.toDate ? d.fechaIngreso.toDate().toLocaleString() : '';
      tablaEquipos.row.add([
        d.idPropio || docu.id, // mostrar ID propio si existe, si no el ID de Firebase
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

  // ----------------- REGISTRAR PRESUPUESTO -----------------
  const formPresupuesto = document.getElementById('formPresupuesto');
  const mensajePresupuesto = document.getElementById('mensajePresupuesto');

  formPresupuesto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const equipoId = document.getElementById('presupuestoEquipoId').value.trim();
    if (!equipoId) return alert("Debe ingresar un ID de equipo válido");

    const pres = {
      equipoId,
      reparacion: parseFloat(document.getElementById('presupuestoReparacion').value) || 0,
      repuestos: parseFloat(document.getElementById('presupuestoRepuestos').value) || 0,
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
    } catch (error) {
      console.error("Error al registrar presupuesto:", error);
      alert("Ocurrió un error al registrar el presupuesto.");
    }
  });

  // ----------------- CARGAR PRESUPUESTOS -----------------
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

  // ----------------- INICIALIZAR -----------------
  cargarEquipos();
  cargarPresupuestos();

});
