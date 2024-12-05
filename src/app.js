const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const tf = require('@tensorflow/tfjs-node');
const db = require('./firebase');

let model;

async function loadModel() {
    model = await tf.loadLayersModel('file://path/to/your/model/model.json');
    console.log('Model loaded successfully');
}

const init = async () => {
    const server = Hapi.server({
        port: 8080,
        host: '0.0.0.0',
        routes: {
            payload: {
                maxBytes: 1000000,
                output: 'stream',
                parse: true,
                multipart: true
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/predict',
        options: {
            payload: {
                maxBytes: 1000000
            }
        },
        handler: async (request, h) => {
            try {
                const { payload } = request;
                if (!payload.image) {
                    throw Boom.badRequest('Gambar tidak ditemukan dalam request.');
                }

                const fileData = payload.image._data;

                if (!fileData) {
                    throw Boom.badRequest('File tidak valid.');
                }

                const tensor = tf.node.decodeImage(fileData, 3)
                    .resizeBilinear([224, 224])
                    .expandDims(0)
                    .div(255.0);

                const prediction = model.predict(tensor).dataSync();
                const result = prediction[0] > 0.5 ? 'Cancer' : 'Non-cancer';

                const id = uuidv4();
                const suggestion = result === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';
                const createdAt = new Date().toISOString();

                const predictionData = {
                    id,
                    result,
                    suggestion,
                    createdAt
                };

                await db.collection('predictions').doc(id).set(predictionData);

                return h.response({
                    status: 'success',
                    message: 'Model is predicted successfully',
                    data: predictionData
                }).code(200);

            } catch (err) {
                if (err.isBoom) {
                    return err;
                }
                console.error(err);
                return Boom.badRequest('Terjadi kesalahan dalam melakukan prediksi.');
            }
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

loadModel()
    .then(() => init())
    .catch(err => {
        console.error('Error loading model:', err);
        process.exit(1);
    });
