const API_BASE_URL = "https://recyctech-back.onrender.com";

export async function enviarImagemAPI(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    const response = await fetch(`${API_BASE_URL}/analisar`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) throw new Error("Erro na API");

    return await response.json();
}
