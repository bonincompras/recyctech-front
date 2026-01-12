import * as tf from "@tensorflow/tfjs";

// Supondo que você tenha carregado o modelo TFJS
let model_recycling_local;
async function carregarModeloLocal() {
    model_recycling_local = await tf.loadLayersModel("/modelo_reciclavel/model.json");
}

// Função de fallback
async function analisarImagemLocal(file) {
    // Converte a imagem para tensor
    const imageBitmap = await createImageBitmap(file);
    let tensor = tf.browser.fromPixels(imageBitmap)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims();

    // Faz a predição
    const predictions = model_recycling_local.predict(tensor);
    const data = await predictions.data();

    // Seleciona a categoria com maior confiança
    const categories = ['Plastico', 'Papel', 'Metal', 'Vidro'];
    const maxIndex = data.indexOf(Math.max(...data));
    const className = categories[maxIndex];
    const confidence = (data[maxIndex] * 100).toFixed(2);

    return {
        objetos: [{
            objeto: "Imagem_inteira",
            categoria: className,
            confianca: parseFloat(confidence),
            caixa: [0, 0, imageBitmap.width, imageBitmap.height]
        }]
    };
}
