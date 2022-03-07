require('dotenv').config()

/**
 * Défini que l'app utilisera express
 */
const express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    bodyParser = require('body-parser');

/**
 * Définition de l'utilisation de bodyParser
 */
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/**
 * Définition du Header par défaut
 */
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
/**
 * Import des routes
 */
const tensorflowRoutes = require('./routes/tensorflowRoutes');

/**
 * Mise en utilisation des routes
 */
app.use(tensorflowRoutes);

/**
 * Mise en écoute de l'app
 */
app.listen(port);

const log = console.log;
const chalk = require('chalk');

log(chalk.bgGreen.black(process.env.APPNAME + ' RESTful API server started on: ' + port));

const tensorflowController = require("./controllers/tensorflowController")
tensorflowController.train(100).then(() => {

})

