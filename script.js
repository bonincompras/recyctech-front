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

/* === ELEMENTOS DE RESULTADO PRINCIPAL === */
let categoriaSpan;
let barraConfianca;

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
btnEnviar.disabled = true;
btnRemover.disabled = true;
feedbackSection.style.display = "none";

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

    status.textContent = "";

    btnEnviar.disabled = true;
    btnRemover.disabled = true;
    btnEnviarFeedback.disabled = true;

    feedbackRadios.forEach(r => {
        r.checked = false;
        r.disabled = false;
    });

    categoriaCorreta.value = "";
    categoriaCorreta.disabled = false;
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
btnRemover.addEventListener("click", limparImagem);

/* ================= RESULTADO ================= */
function criarResumoPrincipal() {
    const resumo = document.createElement("div");
    resumo.innerHTML = `
        <p><strong>Categoria principal:</strong>
            <span id="categoria" class="categoria-destacada"></span>
        </p>
        <p><strong>Confiança:</strong></p>
        <div class="barra-confianca">
            <div id="barraConfianca"></div>
        </div>
    `;
    resultadoDiv.prepend(resumo);

    categoriaSpan = document.getElementById("categoria");
    barraConfianca = document.getElementById("barraConfianca");
}

function mostrarResultado(data) {
    objetosList.innerHTML = "";

    if (!categoriaSpan || !barraConfianca) {
        criarResumoPrincipal();
    }

    const ctx = canvas.getContext("2d");
    canvas.width = preview.clientWidth;
    canvas.height = preview.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data.objetos || data.objetos.length === 0) {
        status.textContent = "Nenhum objeto detectado.";
        return;
    }

    // Objeto principal = maior confiança
    const principal = data.objetos.reduce((a, b) =>
        b.confianca > a.confianca ? b : a
    );

    categoriaSpan.textContent = principal.categoria;
    barraConfianca.style.width = principal.confianca + "%";
    barraConfianca.textContent = principal.confianca + "%";
    barraConfianca.style.background =
        principal.confianca >= 85 ? "#4caf50" : "#ff9800";

    data.objetos.forEach(obj => {
        const p = document.createElement("p");
        p.textContent = `${obj.categoria} — ${obj.confianca}%`;
        objetosList.appendChild(p);

        const [x, y, w, h] = obj.bbox;

        ctx.strokeStyle = "#e53935";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "#e53935";
        ctx.font = "14px Arial";
        ctx.fillText(
            `${obj.categoria} ${obj.confianca}%`,
            x + 4,
            y > 15 ? y - 5 : y + 15
        );
    });

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
feedbackRadios.forEach(radio => {
    radio.addEventListener("change", () => {
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
