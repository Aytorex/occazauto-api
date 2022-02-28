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
 * Mise en écoute de l'app
 */
app.listen(port);

const log = console.log;
const chalk = require('chalk');

log(chalk.bgGreen.black(process.env.APPNAME+ ' RESTful API server started on: ' + port));
