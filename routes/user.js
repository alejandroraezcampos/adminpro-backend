var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var authMiddelware = require('../middlewares/authentication');
var app = express();

var User = require('../models/user');

// ==========================================
// Obtener todos los usuarios
// ==========================================
app.get('/', (req, res, next) => {
    var from = req.query.from || 0;
    from = Number(from);
    User.find({}, 'name email img role google')
        .skip(from)
        .limit(5)
        .exec(
            (err, users) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        message: 'Error cargando usuario',
                        errors: err
                    });
                }

                User.count({}, (err, count) => {
                    res.status(200).json({
                        ok: true,
                        found: count,
                        users: users
                    });
                });
            });
});
// ==========================================
// Get User By ID
// ==========================================
app.get('/:id', (req, res, next) => {
    var id = req.params.id;
    User.findById(id, '_id name email google role img')
        .exec((err, user) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error cargando usuario',
                    errors: err
                });
            }
            if (!user) {
                return res.status(500).json({
                    ok: false,
                    message: 'No found user',
                    errors: { message: 'Not exists this user ' }
                });
            }

            return res.status(200).json({
                ok: true,
                user: user
            });

        });
});


// ==========================================
// Crear un nuevo usuario
// ==========================================
app.post('/', (req, res) => {

    var body = req.body;

    var user = new User({
        name: body.name,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    user.save((err, createdUser) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear usuario',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            user: createdUser,
            userToken: req.user
        });


    });

});


// ==========================================
// Actualizar usuario
// ==========================================
app.put('/:id', [authMiddelware.verifyToken, authMiddelware.verifyADMIN_or_SelfUser], (req, res) => {

    var id = req.params.id;
    var body = req.body;

    User.findById(id, (err, user) => {


        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!user) {
            return res.status(400).json({
                ok: false,
                message: 'El usuario con el id ' + id + ' no existe',
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }


        user.name = body.name;
        user.email = body.email;
        user.role = body.role;

        user.save((err, updatedUser) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al actualizar usuario',
                    errors: err
                });
            }

            updatedUser.password = ':)';

            res.status(200).json({
                ok: true,
                user: updatedUser
            });

        });

    });

});





// ============================================
//   Borrar un usuario por el id
// ============================================
app.delete('/:id', [authMiddelware.verifyToken, authMiddelware.verifyADMIN_or_SelfUser], (req, res) => {

    var id = req.params.id;

    User.findByIdAndRemove(id, (err, deletedUser) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error borrar usuario',
                errors: err
            });
        }

        if (!deletedUser) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un usuario con ese id',
                errors: { message: 'No existe un usuario con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            user: deletedUser
        });

    });

});


module.exports = app;