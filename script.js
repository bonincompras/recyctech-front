/* ================= IMPORT API ================= */
import { enviarImagemAPI } from "./api.js";

/* ================= ELEMENTOS ================= */
const inputImagem = document.getElementById("inputImagem");
const dropArea = document.getElementById("dropArea");
const preview = document.getElementById("preview");
const canvas = document.getElementById("canvas");

const nomeArquivo = document.getElementById("nomeArquivo");
const tamanhoArquivo = document.getElementById("tamanhoArquivo");
const infoArquivo = document.getElementById("infoArquivo");

const btnEnviar = document.getElementById("btnEnviar");
const btnRemover = document.getElementById("btnRemover");
const status = document.getElementById("status");

const loader = document.getElementById("loader");

const resultadoDiv = document.getElementById("resultado");
const objetosList = document.getElementById("objetos-list");

/* === RESULTADO PRINCIPAL (JÁ EXISTE NO HTML) === */
const categoriaSpan = document.getElementById("categoria");
const barraConfianca = document.getElementById("barraConfianca");

/* === FEEDBACK === */
const feedbackSection = document.getElementById("feedbackSection");
const feedbackRadios = document.querySelectorAll("input[name='feedback']");
const correcaoDiv = document.getElementById("correcao");
const categoriaCorreta = document.getElementById("categoriaCorreta");
const btnEnviarFeedback = document.getElementById("btnEnviarFeedback");

/* ================= ESTADO ================= */
const TAMANHO_MAX = 5 * 1024 * 1024;
let arquivoAtual = null;
let resultadoAtual = null;
let analiseRealizada = false;
let feedbackEnviado = false;

/* ================= INICIAL ================= */
infoArquivo.style.display = "none";
resultadoDiv.style.display = "none";
feedbackSection.style.display = "none";
btnEnviar.disabled = true;
btnRemover.disabled = true;

/* ================= FUNÇÕES ================= */
function validarImagem(arquivo) {
    return (
        ["image/jpeg", "image/png"].includes(arquivo.type) &&
        arquivo.size <= TAMANHO_MAX
    );
}

function mostrarImagem(arquivo) {
    const reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
        preview.style.display = "block";
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
    resultadoAtual = null;
    analiseRealizada = false;
    feedbackEnviado = false;

    preview.src = "";
    preview.style.display = "none";

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    infoArquivo.style.display = "none";
    resultadoDiv.style.display = "none";
    feedbackSection.style.display = "none";
    objetosList.innerHTML = "";

    categoriaSpan.textContent = "";
    barraConfianca.style.width = "0%";
    barraConfianca.textContent = "";

    status.textContent = "";

    btnEnviar.disabled = true;
    btnRemover.disabled = true;
    btnEnviarFeedback.disabled = true;

    feedbackRadios.forEach(r => {
        r.checked = false;
        r.disabled = false;
        r.parentElement.classList.remove("checked"); // remove visual
    });

    categoriaCorreta.value = "";
    categoriaCorreta.disabled = false;
}

/* ================= MODAL CONFIRMAÇÃO ================= */
function mostrarConfirmacao(onConfirmar) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 1000;

    const modal = document.createElement("div");
    modal.style.background = "#fff";
    modal.style.padding = "25px";
    modal.style.borderRadius = "12px";
    modal.style.maxWidth = "400px";
    modal.style.textAlign = "center";
    modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
    modal.innerHTML = `
        <h3>Remover imagem?</h3>
        <p style="margin:15px 0;">
            A imagem já foi analisada e o feedback ainda não foi enviado.<br>
            Se remover agora, o resultado será perdido.
        </p>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button id="cancelar" style="flex:1; padding:10px;">Cancelar</button>
            <button id="confirmar" style="flex:1; padding:10px; background:#e53935; color:#fff; border:none;">Remover</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector("#cancelar").onclick = () => {
        document.body.removeChild(overlay);
    };

    modal.querySelector("#confirmar").onclick = () => {
        document.body.removeChild(overlay);
        onConfirmar();
    };
}

/* ================= INPUT ================= */
inputImagem.addEventListener("change", () => {
    const arquivo = inputImagem.files[0];
    if (arquivo && validarImagem(arquivo)) {
        arquivoAtual = arquivo;
        mostrarImagem(arquivo);
    }
});

/* ================= DRAG & DROP ================= */
dropArea.addEventListener("click", () => inputImagem.click());

dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && validarImagem(arquivo)) {
        arquivoAtual = arquivo;
        mostrarImagem(arquivo);
    }
});

/* ================= REMOVER ================= */
btnRemover.addEventListener("click", () => {
    if (analiseRealizada && !feedbackEnviado) {
        mostrarConfirmacao(limparImagem);
    } else {
        limparImagem();
    }
});

/* ================= RESULTADO ================= */
function mostrarResultado(data) {
    if (!data.objetos || data.objetos.length === 0) {
        status.textContent = "Nenhum objeto detectado.";
        return;
    }

    const principal = data.objetos.reduce((a, b) =>
        b.confianca > a.confianca ? b : a
    );

    categoriaSpan.textContent = principal.categoria;

    barraConfianca.style.width = principal.confianca + "%";
    barraConfianca.textContent = principal.confianca + "%";
    barraConfianca.style.background =
        principal.confianca >= 85 ? "#4caf50" : "#ff9800";

    const ctx = canvas.getContext("2d");
    canvas.width = preview.clientWidth;
    canvas.height = preview.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const [x, y, w, h] = principal.bbox;

    ctx.strokeStyle = "#e53935";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#e53935";
    ctx.font = "14px Arial";
    ctx.fillText(
        `${principal.categoria} ${principal.confianca}%`,
        x + 4,
        y > 15 ? y - 5 : y + 15
    );

    resultadoDiv.style.display = "block";
    feedbackSection.style.display = "block";
}

/* ================= ENVIAR PARA API ================= */
btnEnviar.addEventListener("click", async () => {
    if (!arquivoAtual) return;

    loader.style.display = "flex";
    btnEnviar.disabled = true;
    btnRemover.disabled = true;

    try {
        const data = await enviarImagemAPI(arquivoAtual);
        resultadoAtual = data;
        mostrarResultado(data);

        analiseRealizada = true;
        status.textContent = "Análise concluída.";
    } catch (err) {
        console.error(err);
        status.textContent = "Erro ao analisar imagem.";
    } finally {
        loader.style.display = "none";
        btnEnviar.disabled = false;
        btnRemover.disabled = false;
    }
});

/* ================= FEEDBACK ================= */
// Marca visual da opção selecionada
feedbackRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        feedbackRadios.forEach(r => r.parentElement.classList.remove("checked"));
        radio.parentElement.classList.add("checked");

        if (radio.value === "categoria_errada") {
            correcaoDiv.style.display = "block";
            btnEnviarFeedback.disabled = true;
        } else {
            correcaoDiv.style.display = "none";
            btnEnviarFeedback.disabled = false;
        }
    });
});

categoriaCorreta.addEventListener("change", () => {
    btnEnviarFeedback.disabled = categoriaCorreta.value === "";
});

btnEnviarFeedback.addEventListener("click", () => {
    feedbackEnviado = true;
    btnEnviarFeedback.disabled = true;
    feedbackRadios.forEach(r => (r.disabled = true));
    categoriaCorreta.disabled = true;
    status.textContent = "Obrigado pelo feedback! 🙌";
});
