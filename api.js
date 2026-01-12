const API_BASE_URL = "https://recyctech-back-1.onrender.com";

export async function enviarImagemAPI(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    // Cria um fetch com timeout de 10 segundos
    const fetchPromise = fetch(`${API_BASE_URL}/analisar`, {
        method: "POST",
        body: formData
    });

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: a API demorou mais de 10s")), 10000)
    );

    try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            throw new Error(`Erro ao analisar a imagem: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.objetos || !Array.isArray(data.objetos)) {
            throw new Error("Resposta da API não contém um array de objetos");
        }

        return data;
    } catch (error) {
        console.warn("Falha na API, fazendo fallback local:", error.message);
        return analisarImagemLocal(arquivo); // <-- fallback local
    }
}




export async function enviarFeedbackAPI(categoria, feedbackSelecionado) {
    const formData = new FormData();
    formData.append("categoria", categoria);  // Envia a categoria
    formData.append("feedback", feedbackSelecionado);  // Envia o feedback

    const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro ao enviar feedback: ", errorData);
        throw new Error("Erro ao enviar feedback");
    }

    return await response.json();
}



