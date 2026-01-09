/* ================= ELEMENTOS ================= */
const inputImagem = document.getElementById("inputImagem");
const dropArea = document.getElementById("dropArea");
const preview = document.getElementById("preview");
const nomeArquivo = document.getElementById("nomeArquivo");
const tamanhoArquivo = document.getElementById("tamanhoArquivo");
const infoArquivo = document.getElementById("infoArquivo");
const btnRemover = document.getElementById("btnRemover");
const btnEnviar = document.getElementById("btnEnviar");
const status = document.getElementById("status");
const resultadoDiv = document.getElementById("resultado");
const categoriaSpan = document.getElementById("categoria");
const barraConfianca = document.getElementById("barraConfianca");
const feedbackSection = document.getElementById("feedbackSection");
const feedbackRadios = document.querySelectorAll("input[name='feedback']");
const correcaoDiv = document.getElementById("correcao");
const categoriaCorreta = document.getElementById("categoriaCorreta");
const btnEnviarFeedback = document.getElementById("btnEnviarFeedback");
const loader = document.getElementById("loader");

/* ================= ESTADO ================= */
const TAMANHO_MAX = 5 * 1024 * 1024;
let arquivoAtual = null;
let resultadoAtual = null;
let feedbackSelecionado = null;
let analiseRealizada = false;
let feedbackEnviado = false;

/* ================= INICIAL ================= */
infoArquivo.style.display = "none";
btnEnviar.disabled = true;
btnRemover.disabled = true;

/* ================= API ================= */
import { enviarImagemAPI } from "./api.js";

/* ================= FUNÇÕES ================= */
function validarImagem(arquivo) {
    if (!["image/jpeg", "image/png"].includes(arquivo.type)) return false;
    if (arquivo.size > TAMANHO_MAX) return false;
    return true;
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
    feedbackSelecionado = null;

    preview.style.display = "none";
    preview.src = "";

    nomeArquivo.textContent = "---";
    tamanhoArquivo.textContent = "---";
    infoArquivo.style.display = "none";

    resultadoDiv.style.display = "none";
    feedbackSection.style.display = "none";
    correcaoDiv.style.display = "none";

    categoriaSpan.textContent = "";
    categoriaSpan.className = "categoria-destacada";
    barraConfianca.style.width = "0";
    barraConfianca.textContent = "";

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

    analiseRealizada = false;
    feedbackEnviado = false;

    // limpar canvas se existir
    const canvas = document.getElementById("canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
    if (!analiseRealizada) {
        limparImagem();
        return;
    }

    if (analiseRealizada && !feedbackEnviado) {
        mostrarConfirmacao(limparImagem);
        return;
    }

    limparImagem();
});

/* ================= ENVIAR IMAGEM PARA API ================= */
btnEnviar.addEventListener("click", async () => {
    if (!arquivoAtual) return;

    loader.style.display = "flex";
    btnEnviar.disabled = true;
    btnRemover.disabled = true;
    status.textContent = "Analisando imagem...";

    try {
        const data = await enviarImagemAPI(arquivoAtual);

        // data.objetos = [{ categoria, confianca, bbox: [x_min, y_min, x_max, y_max] }]
        // data.largura_imagem, data.altura_imagem

        // desenhar no canvas
        let canvas = document.getElementById("canvas");
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "canvas";
            preview.parentNode.insertBefore(canvas, preview.nextSibling);
            canvas.style.position = "absolute";
            canvas.style.left = preview.offsetLeft + "px";
            canvas.style.top = preview.offsetTop + "px";
        }
        canvas.width = preview.width;
        canvas.height = preview.height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // desenhar cada objeto detectado
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
        });

        // mostrar resultados gerais
        resultadoAtual = data;
        categoriaSpan.textContent = data.objetos.map(o => o.categoria).join(", ");
        barraConfianca.style.width = Math.max(...data.objetos.map(o => o.confianca)) + "%";
        barraConfianca.textContent = Math.max(...data.objetos.map(o => o.confianca)) + "%";
        barraConfianca.style.background = "#4caf50";

        resultadoDiv.style.display = "block";
        feedbackSection.style.display = "block";
        analiseRealizada = true;
        feedbackEnviado = false;
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
        feedbackSelecionado = radio.value;

        document.querySelectorAll(".feedback label")
            .forEach(l => l.classList.remove("checked"));
        radio.parentElement.classList.add("checked");

        if (feedbackSelecionado === "categoria_errada") {
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
    btnEnviarFeedback.disabled = true;
    feedbackRadios.forEach(r => r.disabled = true);
    categoriaCorreta.disabled = true;

    feedbackEnviado = true;
    status.textContent = "Obrigado pelo feedback! 🙌";
});
