import { enviarImagemAPI } from "./api.js";

/* ================= ELEMENTOS ================= */
const inputImagem = document.getElementById("inputImagem");
const dropArea = document.getElementById("dropArea");
const preview = document.getElementById("preview");
const previewContainer = document.getElementById("preview-container");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const nomeArquivo = document.getElementById("nomeArquivo");
const tamanhoArquivo = document.getElementById("tamanhoArquivo");
const infoArquivo = document.getElementById("infoArquivo");

const btnRemover = document.getElementById("btnRemover");
const btnEnviar = document.getElementById("btnEnviar");
const status = document.getElementById("status");

const resultadoDiv = document.getElementById("resultado");
const objetosList = document.getElementById("objetos-list");

const feedbackSection = document.getElementById("feedbackSection");
const feedbackRadios = document.querySelectorAll("input[name='feedback']");
const correcaoDiv = document.getElementById("correcao");
const categoriaCorreta = document.getElementById("categoriaCorreta");
const btnEnviarFeedback = document.getElementById("btnEnviarFeedback");

const loader = document.getElementById("loader");

/* ================= ESTADO ================= */
const TAMANHO_MAX = 5 * 1024 * 1024;
let arquivoAtual = null;
let analiseRealizada = false;
let feedbackEnviado = false;

/* ================= FUNÇÕES ================= */
function validarImagem(arquivo) {
    return ["image/jpeg", "image/png"].includes(arquivo.type) && arquivo.size <= TAMANHO_MAX;
}

function mostrarImagem(arquivo) {
    const reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = "block";
        setTimeout(() => {
            canvas.width = preview.width;
            canvas.height = preview.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 100);
    };
    reader.readAsDataURL(arquivo);

    nomeArquivo.textContent = arquivo.name;
    tamanhoArquivo.textContent = (arquivo.size / 1024).toFixed(2) + " KB";
    infoArquivo.style.display = "block";

    btnEnviar.disabled = false;
    btnRemover.disabled = false;
}

function limparImagem() {
    arquivoAtual = null;
    preview.src = "";
    preview.style.display = "none";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nomeArquivo.textContent = "---";
    tamanhoArquivo.textContent = "---";
    infoArquivo.style.display = "none";

    resultadoDiv.style.display = "none";
    objetosList.innerHTML = "";
    feedbackSection.style.display = "none";
    correcaoDiv.style.display = "none";

    status.textContent = "";

    btnEnviar.disabled = true;
    btnRemover.disabled = true;
    btnEnviarFeedback.disabled = true;

    feedbackRadios.forEach(r => { r.checked = false; r.disabled = false; });
    categoriaCorreta.value = "";
    categoriaCorreta.disabled = false;

    analiseRealizada = false;
    feedbackEnviado = false;
}

function mostrarResultado(data) {
    resultadoDiv.style.display = "block";
    feedbackSection.style.display = "block";
    objetosList.innerHTML = "";

    canvas.width = preview.width;
    canvas.height = preview.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    data.objetos.forEach(obj => {
        const scaleX = canvas.width / data.largura_imagem;
        const scaleY = canvas.height / data.altura_imagem;
        const [x_min, y_min, x_max, y_max] = obj.bbox;

        ctx.strokeStyle = "#e53935";
        ctx.lineWidth = 2;
        ctx.strokeRect(x_min * scaleX, y_min * scaleY, (x_max - x_min) * scaleX, (y_max - y_min) * scaleY);

        ctx.fillStyle = "#e53935";
        ctx.font = "16px Arial";
        ctx.fillText(`${obj.categoria} (${obj.confianca}%)`, x_min * scaleX, Math.max(y_min * scaleY - 5, 10));

        objetosList.innerHTML += `<p>${obj.categoria} - ${obj.confianca}%</p>`;
    });

    analiseRealizada = true;
    feedbackEnviado = false;
    status.textContent = "Análise concluída.";
}

/* ================= EVENTOS ================= */
inputImagem.addEventListener("change", () => {
    const arquivo = inputImagem.files[0];
    if (arquivo && validarImagem(arquivo)) {
        arquivoAtual = arquivo;
        mostrarImagem(arquivo);
    }
});

dropArea.addEventListener("click", () => inputImagem.click());
dropArea.addEventListener("dragover", e => { e.preventDefault(); dropArea.classList.add("dragover"); });
dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && validarImagem(arquivo)) {
        arquivoAtual = arquivo;
        mostrarImagem(arquivo);
    }
});

btnRemover.addEventListener("click", () => {
    if (!analiseRealizada || feedbackEnviado) {
        limparImagem();
    } else {
        mostrarConfirmacao(limparImagem);
    }
});

btnEnviar.addEventListener("click", async () => {
    if (!arquivoAtual) return;
    loader.style.display = "flex";
    btnEnviar.disabled = true;
    btnRemover.disabled = true;

    try {
        const data = await enviarImagemAPI(arquivoAtual);
        mostrarResultado(data);
    } catch (err) {
        console.error(err);
        status.textContent = "Erro ao analisar imagem";
    } finally {
        loader.style.display = "none";
        btnEnviar.disabled = false;
        btnRemover.disabled = false;
    }
});

/* ================= FEEDBACK ================= */
feedbackRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        feedbackSelecionado = radio.value;
        document.querySelectorAll(".feedback label").forEach(l => l.classList.remove("checked"));
        radio.parentElement.classList.add("checked");
        correcaoDiv.style.display = feedbackSelecionado === "categoria_errada" ? "block" : "none";
        btnEnviarFeedback.disabled = feedbackSelecionado === "categoria_errada";
    });
});

categoriaCorreta.addEventListener("change", () => {
    btnEnviarFeedback.disabled = categoriaCorreta.value === "";
});

btnEnviarFeedback.addEventListener("click", () => {
    btnEnviarFeedback.disabled = true;
    feedbackRadios.forEach(r => r.disabled = true);
    categoriaCorreta.disabled = true;
    feedbackEnviado = true;
    status.textContent = "Obrigado pelo feedback! 🙌";
});
