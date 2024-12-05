const tf = require('@tensorflow/tfjs-node');
async function predictClassification(model, image) {
  const tensor = tf.node
    .decodeJpeg(image)
    .resizeNearestNeighbor([224, 224])
    .expandDims()
    .toFloat()

  const prediction = model.predict(tensor);
  const score = await prediction.data();
  const confidenceScore = Math.max(...score) * 100;
  let result = 'Test'
  let suggestion = 'Test'
  if (confidenceScore > 50) {
    result = 'Cancer';
    suggestion = 'Segera periksa ke dokter!';

  }
  else{
    result = 'Non-cancer';
    suggestion = 'Penyakit kanker tidak terdeteksi.';
  }

  return { confidenceScore, result, suggestion };

}
module.exports = predictClassification;