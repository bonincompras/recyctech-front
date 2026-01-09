import { enviarNumero } from './api.js';

async function testarBackendVisual(numeroTeste = 10) {
    console.log("%cIniciando teste com backend...", "color: blue; font-weight: bold;");

    try {
        const resultado = await enviarNumero(numeroTeste);

        console.log(
            "%c✅ Comunicação OK!", 
            "color: green; font-weight: bold; font-size: 14px;"
        );
        console.log("%cNúmero enviado:", "color: black; font-weight: bold;", numeroTeste);
        console.log("%cResultado recebido:", "color: black; font-weight: bold;", resultado);

    } catch (erro) {
        console.error(
            "%c❌ Erro na comunicação com o backend!", 
            "color: red; font-weight: bold; font-size: 14px;", 
            erro
        );
    }
}

// Chamando a função para testar
testarBackendVisual(10);  // você pode trocar o número
