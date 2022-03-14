const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const fs = require("fs");
const {parse} = require("csv");
const cliProgress = require('cli-progress');
const chalk = require("chalk");
const log = console.log;
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.rect);

// Create a sequential model
const model = tf.sequential();

// Add a single input layer
model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true}));

// Add an output layer
model.add(tf.layers.dense({units: 1, useBias: true}));

// Learning rate is essentially how large of a step
// we take when updating model weights.
const LEARNING_RATE = 0.5;

// Compile the model.
// optimizer: This is the algorithm that is going to govern the
// updates to the model as it sees examples. There are many optimizers
// available in TensorFlow.js.
// loss: this is a function that will tell the model how well it is
// doing on learning each of the batches (data subsets) that it is shown.
model.compile({
    optimizer: tf.train.sgd(LEARNING_RATE),
    loss: 'meanAbsoluteError'
});

function convertToTensor(data) {
    // Wrapping these calculations in a tidy will dispose any
    // intermediate tensors.

    return tf.tidy(() => {
        // Step 1. Shuffle the data
        tf.util.shuffle(data);

        // Step 2. Convert data to Tensor
        const inputs = data.map(d => d.year)
        const labels = data.map(d => d.price);

        const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

        //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
        const inputMax = inputTensor.max();
        const inputMin = inputTensor.min();
        const labelMax = labelTensor.max();
        const labelMin = labelTensor.min();

        const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
        const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

        return {
            inputs: normalizedInputs,
            labels: normalizedLabels,
            // Return the min/max bounds so we can use them later.
            inputMax,
            inputMin,
            labelMax,
            labelMin,
        }
    });
}

async function trainModel(model, inputs, labels, epochs) {
    // Prepare the model for training.
    model.compile({
        optimizer: tf.train.adam(),
        loss: tf.losses.meanSquaredError,
        metrics: ['mse'],
    });

    const batchSize = 32;

    return await model.fit(inputs, labels, {
        batchSize,
        epochs,
        shuffle: true
    });
}

function getPredictedPoints(model, inputData, normalizationData) {
    const {inputMax, inputMin, labelMin, labelMax} = normalizationData;

    // Generate predictions for a uniform range of numbers between 0 and 1;
    // We un-normalize the data by doing the inverse of the min-max scaling
    // that we did earlier.
    const [xs, preds] = tf.tidy(() => {

        const xs = tf.linspace(0, 1, 100);
        const preds = model.predict(xs.reshape([100, 1]));

        const unNormXs = xs
            .mul(inputMax.sub(inputMin))
            .add(inputMin);

        const unNormPreds = preds
            .mul(labelMax.sub(labelMin))
            .add(labelMin);
        // Un-normalize the data
        return [unNormXs.dataSync(), unNormPreds.dataSync()];
    });

    const predictedPoints = Array.from(xs).map((val, i) => {
        return {x: val, y: preds[i]}
    });

    const originalPoints = inputData.map(d => ({
        x: d.year, y: d.price,
    }));

    predictedPoints.forEach(point => {
        point.x = Math.trunc(point.x)
    })
    return predictedPoints;
}

exports.train = async function (epochs) {
    let i;
    let count = 0;
    require('fs').createReadStream('./data/carsTDIA.csv')
        .on('data', function (chunk) {
            for (i = 0; i < chunk.length; ++i)
                if (chunk[i] === 10) count++;
        })
        .on('end', function () {
            log(chalk.bgBlack.white('fetching data...'))
            bar1.start(count, 0);
            let j = 0
            const fetchedData = {
                years: [],
                prices: []
            }
            fs.createReadStream('./data/carsTDIA.csv')
                .pipe(parse({delimiter: ';'}))
                .on('data', function (row) {
                    j++
                    if (parseInt(row[8]) > 0 && parseInt(row[5]) > 0 && row[8] < 200000 && row[8] !== '' && row[5] !== '') {
                        fetchedData.years.push(parseInt(row[5]))
                        fetchedData.prices.push(parseInt(row[8]))
                        bar1.update(j)
                    }
                })
                .on('end', async function () {
                    bar1.stop();
                    log(chalk.bgBlack.white('data fetched!'))
                    // Car year
                    const years = fetchedData.years
                    // car price
                    const prices = fetchedData.prices
                    const values = []

                    for (let i = 0; i < years.length; i++) {
                        values.push({
                            year: years[i],
                            price: prices[i]
                        })
                    }

                    const tensorData = convertToTensor(values)
                    const {inputs, labels} = tensorData;

                    await trainModel(model, inputs, labels, epochs);
                    console.log('Done Training');
                })
        });
}

exports.evaluate = async function (req, res) {
    let i;
    let count = 0;
    require('fs').createReadStream('./data/carsTDIA.csv')
        .on('data', function (chunk) {
            for (i = 0; i < chunk.length; ++i)
                if (chunk[i] === 10) count++;
        })
        .on('end', function () {
            log(chalk.bgBlack.white('fetching data...'))
            bar1.start(count, 0);
            let j = 0
            const fetchedData = {
                years: [],
                prices: []
            }
            fs.createReadStream('./data/carsTDIA.csv')
                .pipe(parse({delimiter: ';'}))
                .on('data', function (row) {
                    j++
                    if (parseInt(row[8]) > 0 && parseInt(row[5]) > 0 && row[8] < 200000 && row[8] !== '' && row[5] !== '') {
                        fetchedData.years.push(parseInt(row[5]))
                        fetchedData.prices.push(parseInt(row[8]))
                        bar1.update(j)
                    }
                })
                .on('end', async function () {
                    bar1.stop();
                    log(chalk.bgBlack.white('data fetched!'))
                    // Car year
                    const years = fetchedData.years
                    // car price
                    const prices = fetchedData.prices
                    const values = []

                    for (let i = 0; i < years.length; i++) {
                        values.push({
                            year: years[i],
                            price: prices[i]
                        })
                    }

                    const tensorData = convertToTensor(values)

                    const predictedPoints = getPredictedPoints(model, values, tensorData)
                    const result = predictedPoints.filter(point => point.x === parseInt(req.query.year))
                    let i = 0;
                    let total = 0;
                    let toReturn = {}
                    let avgPrice = 0;
                    result.forEach(point => {
                        total += point.y
                        i += 1
                    })
                    avgPrice = total / i

                    if (avgPrice >= req.query.price) {
                        toReturn['coeficient'] = (req.query.price/avgPrice) * 100;
                        toReturn['avgPrice'] = avgPrice
                        toReturn['quality'] = 1
                    } else {
                        toReturn['coeficient'] = (avgPrice/req.query.price) * 100;
                        toReturn['avgPrice'] = avgPrice
                        toReturn['quality'] = -1
                    }
                    res.json(toReturn)

                })
        })
}

