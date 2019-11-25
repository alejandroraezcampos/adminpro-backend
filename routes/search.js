var express = require('express');

var app = express();
var Hospital = require('../models/hospital');
var Doctor = require('../models/doctor');
var User = require('../models/user');

// ================================================
// Busqueda por colección
// ================================================
app.get('/collection/:table/:search', (req, res) => {
    var search = req.params.search;
    var regex = new RegExp(search, 'i');
    var table = req.params.table;
    // Aplicamos una paginación
    var from = req.query.from || 0;
    from = Number(from);
    var promise;
    var to = req.query.to || 5;
    to = Number(to);
    switch (table) {
        case 'users':
            promise = searchUsers(search, from, to, regex);
            break;
        case 'doctors':
            promise = searchDoctors(search, from, to, regex);
            break;
        case 'hospitals':
            promise = searchHospitals(search, from, to, regex);
            break;
        default:
            return res.status(400).json({
                ok: false,
                message: 'Los tipos de busqueda sólo son: Usuarios, medicos y hospitales',
                error: { message: 'Tipo de tabla/coleccion no válido' }
            });

    }
    promise.then(data => {
        return res.status(200).json({
            ok: true,
            [table]: data
        });
    });


});
// ================================================
// Busqueda general
// ================================================

app.get('/all/:search', (req, res, next) => {

    var search = req.params.search;
    var regex = new RegExp(search, 'i');
    var from = req.query.from || 0;
    from = Number(from);
    var to = req.query.to || 0;
    to = Number(to);
    Promise.all([
            searchHospitals(search, from, to, regex),
            searchDoctors(search, from, to, regex),
            searchUsers(search, from, to, regex)
        ])
        .then(response => {
            res.status(200).json({
                ok: true,
                hospitals: response[0],
                doctors: response[1],
                users: response[2]
            });
        });
});

function searchHospitals(search, from, to = 5, regex) {

    return new Promise((resolve, reject) => {
        Hospital.find({ name: regex })
            .populate('user', 'name email')
            .skip(from)
            .limit(to)
            .exec((err, hospitals) => {
                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    Hospital.count({ name: regex })
                        .exec((err, count) => {
                            resolve({ hospitals: hospitals, found: count });
                        });
                }
            });
    });
}

function searchDoctors(search, from, to = 5, regex) {

    return new Promise((resolve, reject) => {
        Doctor.find({ name: regex })
            .populate('user', 'name email')
            .populate('hospital')
            .skip(from)
            .limit(to)
            .exec((err, doctors) => {
                if (err) {
                    reject('Error al cargar medicos', err);
                } else {
                    Doctor.count({ name: regex })
                        .exec((err, count) => {
                            resolve({ doctors: doctors, found: count });
                        });
                }
            });
    });
}

function searchUsers(search, from, to = 5, regex) {

    return new Promise((resolve, reject) => {
        User.find({}, 'name email role img google')
            .or([{ 'name': regex }, { 'email': regex }])
            .skip(from)
            .limit(to)
            .exec((err, users) => {
                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    User.count({})
                        .or([{ ' name ': regex }, { 'email': regex }])
                        .exec((err, count) => {
                            resolve({ users: users, found: count });
                        });

                }
            });
    });
}

module.exports = app;