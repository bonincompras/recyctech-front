const API_BASE_URL = "http://127.0.0.1:8000";  // Mudando para o endereço local

export async function enviarImagemAPI(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    try {
        const response = await fetch(`${API_BASE_URL}/analisar`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro ao analisar a imagem: ${response.statusText}`);
        }

        const data = await response.json();

        // Verifique se "data.objetos" existe e é um array
        if (!data.objetos || !Array.isArray(data.objetos)) {
            throw new Error("Resposta da API não contém um array de objetos");
        }

        return data;
    } catch (error) {
        console.error("Erro ao enviar a imagem:", error);
        throw new Error(`Erro ao analisar a imagem: ${error.message}`);
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
