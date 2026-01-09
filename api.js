const API_BASE_URL = "https://recyctech-back.onrender.com";

export async function enviarNumero(numero) {
    const response = await fetch(`${API_BASE_URL}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero })
    });

    if (!response.ok) throw new Error("Erro ao comunicar com o backend");
    return await response.json();
}
