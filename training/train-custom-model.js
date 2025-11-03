// training/train-custom-model.js

import * as tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';

async function trainCustomDLPModel() {
    // Load USE for feature extraction
    const useModel = await use.load();
    
    // Prepare training data
    const trainingData = [
        // Sensitive examples
        { text: "My credit card is 4532-1234-5678-9010", label: 1 },
        { text: "SSN: 123-45-6789", label: 1 },
        { text: "Password: mySecret123!", label: 1 },
        { text: "API_KEY=sk_live_abc123xyz", label: 1 },
        { text: "Confidential merger documentation", label: 1 },
        
        // Safe examples
        { text: "Meeting tomorrow at 3pm", label: 0 },
        { text: "Great work on the presentation", label: 0 },
        { text: "Let's grab lunch next week", label: 0 },
        { text: "Project deadline is Friday", label: 0 },
        { text: "See public documentation here", label: 0 }
    ];
    
    // Extract embeddings
    const texts = trainingData.map(d => d.text);
    const labels = trainingData.map(d => d.label);
    
    const embeddings = await useModel.embed(texts);
    const labelsTensor = tf.tensor2d(labels, [labels.length, 1]);
    
    // Build classifier on top of USE embeddings
    const model = tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [512], // USE embedding size
                units: 128,
                activation: 'relu'
            }),
            tf.layers.dropout({ rate: 0.3 }),
            tf.layers.dense({
                units: 64,
                activation: 'relu'
            }),
            tf.layers.dropout({ rate: 0.3 }),
            tf.layers.dense({
                units: 1,
                activation: 'sigmoid'
            })
        ]
    });
    
    // Compile model
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
    
    // Train
    await model.fit(embeddings, labelsTensor, {
        epochs: 50,
        batchSize: 8,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
        }
    });
    
    // Save model
    await model.save('file://./models/custom');
    
    console.log('Model training complete!');
    
    // Cleanup
    embeddings.dispose();
    labelsTensor.dispose();
}

// Run training
trainCustomDLPModel();
