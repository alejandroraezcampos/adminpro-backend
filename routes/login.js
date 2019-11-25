var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
var app = express();
var User = require('../models/user');

// Google
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);
var CLIENT_ID = require('../config/config').CLIENT_ID;

var authMiddelware = require('../middlewares/authentication');
// ==============================================
// Autenticacion con google
// ===============================================

app.get('/renewToken', authMiddelware.verifyToken, (req, res) => {

    var token = jwt.sign({ user: req.user }, SEED, { expiresIn: 14400 });

    res.status(200).json({
        ok: true,
        token: token
    });
});

// ==============================================
// Autenticacion con google
// ===============================================
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    return {
        name: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    };
}

app.post('/google', async(req, res) => {
    var token = req.body.token;
    var googleUser = await verify(token)
        .catch(err => {
            return res.status(403).json({
                ok: false,
                message: 'Token no válido',
                errors: err
            });
        });

    User.findOne({ email: googleUser.email }, (err, userDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar usuario',
                errors: err
            });
        }

        if (userDB) {
            if (userDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    message: 'Debe de usar su autenticación normal'
                });
            } else {
                var token = jwt.sign({ user: userDB }, SEED, { expiresIn: 14400 }); // 4 horas

                res.status(200).json({
                    ok: true,
                    user: userDB,
                    token: token,
                    id: userDB._id,
                    menu: getMenu(userDB.role)
                });
            }
        } else {
            var user = new User();
            user.name = googleUser.name;
            user.email = googleUser.email;
            user.img = googleUser.img;
            user.google = true;
            user.password = ':)';

            user.save((err, userCreated) => {
                var token = jwt.sign({ user: userDB }, SEED, { expiresIn: 14400 }); // 4 horas
                console.log(userCreated);
                res.status(200).json({
                    ok: true,
                    user: userCreated,
                    token: token,
                    id: userCreated._id,
                    menu: getMenu(userCreated.role)
                });
            });
        }
    });


    // return res.status(200).json({
    //     ok: true,
    //     mensaje: 'OK!!!',
    //     googleUser: googleUser
    // });
});



// ==============================================
// Autenticación normal
// ===============================================

app.post('/', (req, res) => {

    var body = req.body;

    User.findOne({ email: body.email }, (err, userDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!userDB) {
            return res.status(400).json({
                ok: false,
                message: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, userDB.password)) {
            return res.status(400).json({
                ok: false,
                message: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!!
        userDB.password = ':)';

        var token = jwt.sign({ user: userDB }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
            ok: true,
            user: userDB,
            token: token,
            id: userDB._id,
            menu: getMenu(userDB.role)
        });

    })


});

function getMenu(role) {

    var menu = [{
            title: 'Principal',
            icon: 'mdi mdi-gauge',
            submenu: [
                { title: 'Dashboard', url: '/dashboard' }
                // { title: 'Graficas', url: '/graphics' },
                // { title: 'ProgressBar', url: '/progress' }
            ]
        },
        // {
        //     title: 'Mantenimiento',
        //     icon: 'mdi mdi-folder-lock-open',
        //     submenu: [
        //         { title: 'Usuarios', url: '/users' },
        //         { title: 'Medicos', url: '/doctors' },
        //         { title: 'Hospitales', url: '/hospitals' }
        //     ]
        // }
    ];
    if (role === 'ADMIN_ROLE') {
        menu.push({
            title: 'Mantenimiento',
            icon: 'mdi mdi-folder-lock-open',
            submenu: [
                { title: 'Usuarios', url: '/users' },
                { title: 'Medicos', url: '/doctors' },
                { title: 'Hospitales', url: '/hospitals' }
            ]
        });
        // menu[1].submenu.unshift();
    }
    return menu;
}



module.exports = app;