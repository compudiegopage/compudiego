document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  // Abrir / cerrar menú hamburguesa
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");  // animación X
    menu.classList.toggle("open");      // abre/cierra menú
    document.body.classList.toggle("no-scroll");
  });

  // 🔥 CERRAR MENÚ AL TOCAR UN LINK
  document.querySelectorAll("#navMenu a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("active");
      document.body.classList.remove("no-scroll");
    });
  });

});
  

// =======================
// FORMULARIO EMAILJS
// =======================
document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const celular = document.getElementById("celular").value;
    const mensaje = document.getElementById("mensaje").value;
    const status = document.getElementById("formStatus");

    status.innerText = "Enviando...";
    status.style.color = "#444";

    emailjs.send("service_iyucybu", "template_0l94eqw", {
        from_name: nombre,
        from_phone: celular,
        message: mensaje
    })
    .then(() => {
        status.innerText = "Mensaje enviado correctamente ✔";
        status.style.color = "green";

        document.getElementById("contactForm").reset();
    })
    .catch(() => {
        status.innerText = "Error al enviar, intentá nuevamente ❌";
        status.style.color = "red";
    });
});
