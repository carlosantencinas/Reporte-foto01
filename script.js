// Datos simulados
const dataBeneficiarios = [
  { Nombre: "Juan", Apellido: "Pérez", Comunidad: "Norte" },
  { Nombre: "Ana", Apellido: "García", Comunidad: "Sur" },
  { Nombre: "Luis", Apellido: "Torres", Comunidad: "Este" },
];

// Referencias DOM
const comunidadSelect = document.getElementById("comunidad");
const beneficiarioSelect = document.getElementById("beneficiario");
const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");
const imagenesInput = document.getElementById("imagenes");
const btnGenerar = document.getElementById("btnGenerar");
const salidaDiv = document.getElementById("salida");

// Inicializar comunidad
function initComunidades() {
  const comunidades = ["(Todas)", ...new Set(dataBeneficiarios.map(b => b.Comunidad))];
  comunidades.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    comunidadSelect.appendChild(option);
  });
}
initComunidades();

// Actualizar beneficiarios según comunidad
function actualizarBeneficiarios() {
  const comunidad = comunidadSelect.value;
  let beneficiarios = [];
  if (comunidad === "(Todas)") {
    beneficiarios = dataBeneficiarios;
  } else {
    beneficiarios = dataBeneficiarios.filter(b => b.Comunidad === comunidad);
  }
  // Limpiar opciones
  beneficiarioSelect.innerHTML = "";
  const noneOption = document.createElement("option");
  noneOption.textContent = "(Ninguno)";
  noneOption.value = "(Ninguno)";
  beneficiarioSelect.appendChild(noneOption);
  // Añadir beneficiarios
  beneficiarios.forEach(b => {
    const option = document.createElement("option");
    option.value = `${b.Nombre} ${b.Apellido}`;
    option.textContent = `${b.Nombre} ${b.Apellido}`;
    beneficiarioSelect.appendChild(option);
  });
  beneficiarioSelect.value = "(Ninguno)";
}
comunidadSelect.addEventListener("change", actualizarBeneficiarios);
actualizarBeneficiarios();

// Función para convertir archivo a base64 (para imágenes)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

btnGenerar.addEventListener("click", async () => {
  salidaDiv.innerHTML = "";
  if (beneficiarioSelect.value === "(Ninguno)") {
    salidaDiv.textContent = "⚠️ Por favor selecciona un beneficiario.";
    return;
  }
  if (imagenesInput.files.length === 0) {
    salidaDiv.textContent = "⚠️ Por favor sube al menos una imagen.";
    return;
  }
  const nombreCompleto = beneficiarioSelect.value;
  const rowBene = dataBeneficiarios.find(
    b => `${b.Nombre} ${b.Apellido}` === nombreCompleto
  );
  const comunidad = rowBene.Comunidad;
  const fecha = new Date().toLocaleString();

  // Mostrar reporte en HTML
  let html = `<h2>${tituloInput.value}</h2>`;
  html += `<p><b>Fecha:</b> ${fecha}</p>`;
  html += `<p><b>Beneficiario:</b> ${nombreCompleto} - Comunidad: ${comunidad}</p>`;
  html += `<p>${descripcionInput.value}</p><hr>`;
  for (const file of imagenesInput.files) {
    const base64 = await fileToBase64(file);
    html += `<img src="${base64}" style="max-width: 100%; margin-bottom: 10px;"><br>`;
  }
  salidaDiv.innerHTML = html;

  // Generar Excel con SheetJS
  const wb = XLSX.utils.book_new();
  const ws_data = [
    ["Fecha Reporte", "Título", "Descripción", "Beneficiario", "Comunidad"],
    [fecha, tituloInput.value, descripcionInput.value, nombreCompleto, comunidad],
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const excelBlob = new Blob([wbout], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const excelUrl = URL.createObjectURL(excelBlob);
  const aExcel = document.createElement("a");
  aExcel.href = excelUrl;
  aExcel.download = "reporte_beneficiario.xlsx";
  aExcel.textContent = "📥 Descargar Excel";
  aExcel.style.display = "block";
  aExcel.style.marginTop = "1rem";
  salidaDiv.appendChild(aExcel);

  // Generar PDF con jsPDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text(tituloInput.value, 105, 20, null, null, "center");
  pdf.setFontSize(12);
  pdf.text(`Fecha: ${fecha}`, 10, 40);
  pdf.text(`Beneficiario: ${nombreCompleto} - Comunidad: ${comunidad}`, 10, 50);
  pdf.text(descripcionInput.value, 10, 60);

  let y = 70;
  for (const file of imagenesInput.files) {
    const base64 = await fileToBase64(file);
    // Insertar imagen en PDF
    // jsPDF solo soporta imágenes base64 en formato jpeg o png
    // Reducimos la imagen para que quepa
    const img = new Image();
    img.src = base64;
    await new Promise(resolve => {
      img.onload = () => {
        const imgWidth = 180;
        const imgHeight = (img.height * imgWidth) / img.width;
        if (y + imgHeight > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.addImage(img, "JPEG", 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
        resolve();
      };
    });
  }

  const pdfBlob = pdf.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const aPDF = document.createElement("a");
  aPDF.href = pdfUrl;
  aPDF.download = `reporte_${nombreCompleto.replace(/ /g, "_")}.pdf`;
  aPDF.textContent = "📥 Descargar PDF";
  aPDF.style.display = "block";
  aPDF.style.marginTop = "0.5rem";
  salidaDiv.appendChild(aPDF);
});

