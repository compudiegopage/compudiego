var numeroPagina;
var visitas;
var variable;
function buscarSeriesPorPagina(){

  visitas = localStorage.getItem('visitas');
  var busqueda = document.getElementById('busqueda').value
  document.getElementById('resultados').innerHTML = " ";
  document.getElementById('historial').innerHTML = "";
  errorBusqueda = document.getElementById('errorBusqueda');
  localStorage.setItem('visitas',busqueda);
   

	$.ajax({
		url:  "https://www.episodate.com/api/search?q="+busqueda+"&page="+numeroPagina,
		type: 'GET',
		dataType: "json",
		success: function(data){
			if(data.total==0){
				errorBusqueda.innerHTML = "Sin resultados, pruebe nuevamente.";
			}
			else{
				errorBusqueda.innerHTML = "";
				var total = Number(data.total)/data.pages;
				if(visitas===null){
					
				}
				else{
					historial.innerHTML = "<br><button type='submit' id='compartido' class='btn' type='button' onclick='relanzar()'>Última Búsqueda: "+visitas+"</button>"
				}
				for(i=0;i<total;i++){
					console.log(data.total/data.page)
					resultados.innerHTML += 
					"<article class='serie' id='texto'>"+
						"<h2><i>"+data.tv_shows[i].name+"</i></h2></br>"+
						"<input class='botonimagen' type=image src='"+data.tv_shows[i].image_thumbnail_path+"' onclick='intercambiar("+data.tv_shows[i].id+")'></input>"+
						"<p><b><br>Pais: "+data.tv_shows[i].country+
							"</br>Fecha de Inicio: "+data.tv_shows[i].start_date+
							"</br>Estado de la serie: "+data.tv_shows[i].status+
							"</br>Cadena de TV: "+data.tv_shows[i].network+
						"</p></b><br>"+
						"<button type='submit' id='compartido2' class='btn' onclick='intercambio("+data.tv_shows[i].id+")'>Compartir</button>"+
						"<p> </p>"
					"</article>"
				}
				paginas(data.pages);
			}
		}
	})
}
function relanzar(){
	resultados.innerHTML="";
	$.ajax({
		url:  "https://www.episodate.com/api/search?q="+visitas+"&page="+numeroPagina,
		type: 'GET',
		dataType: "json",
		success: function(data){
			if(data.total==0){
				errorBusqueda.innerHTML = "Sin resultados, pruebe nuevamente";
			}
			else{
				errorBusqueda.innerHTML = "";
				var total = Number(data.total)/data.pages;
				if(visitas===null){
					
				}
				else{
					historial.innerHTML = "<br><button type='submit' id='compartido' class='btn' type='button' onclick='relanzar()'>Última Búsqueda: "+visitas+"</button>"
				}
				for(i=0;i<total;i++){
					console.log(data.total/data.page)
					resultados.innerHTML += 
					"<article class='serie' id='texto'>"+
						"<h2><i>"+data.tv_shows[i].name+"</i></h2></br>"+
						"<input class='botonimagen' type=image src='"+data.tv_shows[i].image_thumbnail_path+"' onclick='intercambiar("+data.tv_shows[i].id+")'></input>"+
						"<p><b><br>Pais: "+data.tv_shows[i].country+
							"</br>Fecha de Inicio: "+data.tv_shows[i].start_date+
							"</br>Estado de la serie: "+data.tv_shows[i].status+
							"</br>Cadena de TV: "+data.tv_shows[i].network+
						"</p></b><br>"+
						"<button type='submit' id='compartido2' class='btn' onclick='intercambio("+data.tv_shows[i].id+")'>Compartir</button>"+
						"<p> </p>"
					"</article>"
				}
				paginas(data.pages);
			}
		}
	})
}
function buscarSeries(numero){
	numeroPagina = numero;
	buscarSeriesPorPagina();
}
function paginas (pagina){
	document.getElementById('paginado').innerHTML="";

	var paginas = "";
	var i = numeroPagina -5;
	if(i<1){
		i=1;
	}
	for (i; i<numeroPagina+5 && i<=pagina; i++){
		var active = i==numeroPagina?" class='active' ":""
		paginas += '<a href="#"'+active+' onclick ="seleccionarPagina('+i+')">'+i+'</a>'
		
	}
	var paginados = 
	'<div class="pagination">'+paginas+'</div>';
	console.log(paginado)
	paginado.innerHTML += paginados;
}
function seleccionarPagina(pagina){
	numeroPagina = pagina;
	buscarSeriesPorPagina();
}

function intercambiar(id){
	localStorage.setItem('variable', id);
	window.location.href ='resultados.html';
}

function mostrarSerie(){
	document.getElementById('verSerie').innerHTML = "";
  $.ajax({
	  url: "https://www.episodate.com/api/show-details?q="+localStorage.getItem('variable'),
	  type: 'GET',
	  dataType: "json",
	  success: function(data){
				  var fotos = data.tvShow.pictures;
				  var recortadas = fotos.toString();
				  var recortadas2 = recortadas.split(",",fotos.length)
				  var vacio = true;
				  impresorDeImagenes = []
				  for(i=0;i<fotos.length; i++){
					  impresorDeImagenes.push("<img src='"+recortadas2[i]+"'/>");
				  }	
				  if(fotos.length === 0){
					  vacio = false;
				  }			
				  verSerie.innerHTML += 
				  "<div class='serie'>"+
					  "<h1>"+data.tvShow.name+"</h1>"+
					  "<p> </p>"+
					  "<span>"+
						  "<p id= 'texto'><b>Sinopsis:</b> <br>"+
						  data.tvShow.description+
						  "<p> </p>"+
						  (data.tvShow.description_source?
						  "<p id= 'texto'><b>Mas info:</b> <a  href ='"+data.tvShow.description_source+"' target='_blank'>Click Aqui</a></p>" :
						  "")+
						  "<p> </p>"+
						  "<b id='texto'>Trailer:</b></p>"+
						  "<p> </p>"+
						  "<div class='video-responsive'><iframe src=https://www.youtube.com/embed/"+data.tvShow.youtube_link+" frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe></div>"+
						  "<p> </p>"+
						  (vacio?
						  "<b id= 'texto'>Galeria de imágenes:</b>"+
						  "<p> </p>"+
						  impresorDeImagenes:
						  "<p> </p>")+
						  "<br><p id='texto'><b>Cadena de TV:</b> "+data.tvShow.network+"</p>"+
						  (data.tvShow.genres?
						  "<p id='texto'><b>Generos: </b>"+data.tvShow.genres+"</p>" :
						  " ")+
					 "</span>"+
				  "</div>"

	  }
  })
}

function intercambio(id){
	localStorage.setItem("variableCompartir", id);
	window.location.href ='compartir.html';
}


function compartir(){
	document.getElementById('formulario').innerHTML = "";
	$.ajax({
		url: "https://www.episodate.com/api/show-details?q="+localStorage.getItem('variableCompartir'),
		type: 'GET',
		dataType: "json",
		success: function(data){
					formulario.innerHTML += 
					"<form action method='POST' id='formularioCompartir' type='submit' >"+
						"<label for='nombre'><b>Nombre: </b>"+data.tvShow.name+"</b></label><br><br>"+
						"<label for='nombre'><b>Descripcion: </b>"+data.tvShow.description+"</b></label><br>"+
						"<h3 id='titulados'><b>Enviar por email a un amigo </b></h3><br>"+
						"<div id='erroresTipeo'>"+
							"<h4 id='errorEmail'></h4>"+
							"<h4 id='errorEmail2'></h4>"+
							"<h4 id='errorEmail3'></h4>"+
						"</div>"+
						"<input type='text' name='emisor' id='emisor' placeholder= 'Email Emisor (requerido)'><br>"+
						"<input type='text' name='destino' id='destino' placeholder= 'Email Destino (requerido)'><br>"+
						"<input type='text' name='mensaje' id='comentario' placeholder= 'Comentario (opcional)'><br><br>"+
						"<input id='compartido' type='button' value='Enviar Email' onclick='validate();'><br>"+
            			"<input id='compartido'type='button' onclick='cancelar();' value='Cancelar'>"+
					"</form>"
					}
	})
}

function validate(){
	//obtengo variables
	email = document.getElementById("emisor").value;
	email2 = document.getElementById("destino").value;
	comentario = document.getElementById("comentario").value;
	error = document.getElementById("errorEmail")
	error2 = document.getElementById("errorEmail2")
	error3 = document.getElementById("errorEmail3")

	//pongo en blanco los errores
	error.innerHTML="";
	error2.innerHTML="";
	error3.innerHTML="";
	//guardo en local storage receptor y comentario para enviar al mail
	localStorage.setItem("receptor", email2);
	localStorage.setItem("comentario", comentario);

	//expresion para validar email
	expresion = /\w+@+\w+\.+[a-z]/;

	if(email === "" || email2 === ""){
		error.innerHTML="Los campos de Email son obligatorios"
		return false;
	}
	else if(!expresion.test(email) || !expresion.test(email2)){
		error2.innerHTML = "Formato de Email Incorrecto"
		return false;
	}
	enviar();
}

function cancelar(){
	var mensaje;
    var opcion = confirm("¿Seguro que desea cancelar?");
    if (opcion == true) {
		window.location.href ='index.html';
	} else {
		return false;
	}
}

function enviar(){
	document.getElementById('enviarMail').innerHTML = "";
		$.ajax({
		url: "https://www.episodate.com/api/show-details?q="+localStorage.getItem('variableCompartir'),
		type: 'GET',
		dataType: "json",
		success: function(data){
			var mail = "mailto:"+localStorage.getItem('receptor')+"?&subject=Te comparto una serie"+
								"&body=Nombre de la serie: "+data.tvShow.name+" %0D%0A %0D%0ADescripcion: "+data.tvShow.description+
								"%0D%0A %0D%0AComentario: "+localStorage.getItem('comentario')+"";
			window.open(mail,'popup','toolbar=yes,scrollbars=yes,resizable=yes,top=200,left=600,width=700,height=700');
		}
	})
	
}

function popular(){
	document.getElementById('mostPopular').innerHTML = "";
	$.ajax({
		url: "https://www.episodate.com/api/most-popular?page=1",
		type: 'GET',
		dataType: "json",
		success: function(data){
					for(i=0;i<data.total;i++){
					mostPopular.innerHTML += 
					"<div class='serie'>"+
						"<h2>"+data.tv_shows[i].name+"</h2></br>"+
						"<input class='botonimagen'type=image src='"+data.tv_shows[i].image_thumbnail_path+"' onclick='intercambiar("+data.tv_shows[i].id+")'></input>"+
						"<p><b><br>Pais: "+data.tv_shows[i].country+
							"</br>Fecha de Inicio: "+data.tv_shows[i].start_date+
							"</br>Estado de la serie: "+data.tv_shows[i].status+
							"</br>Cadena de TV: "+data.tv_shows[i].network+
						"</p></b><br>"+
						"<button type='submit' id='compartido2' class='btn' onclick='intercambio("+data.tv_shows[i].id+")'>Compartir</button>"+
					"</div>"
				}
			}
	})
	
}
function mapa (){
	var map = L.map('map').setView([-34.922609, -57.956180], 13);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	L.marker([-34.922609, -57.956180]).addTo(map)
    .bindPopup('Oficina Principal.<br> Catedral La Plata.')
    .openPopup();
}