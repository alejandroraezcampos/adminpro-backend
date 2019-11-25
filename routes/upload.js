var express = require('express');
var fileUpload = require('express-fileupload');
var app = express();
var fs = require('fs');

var User = require('../models/user');
var Hospital = require('../models/hospital');
var Doctor = require('../models/doctor');

app.use(fileUpload());

app.put('/:type/:id', (req, res, next) => {

    var type = req.params.type;
    var id = req.params.id;

    //tipos de coleccion permitidos
    var validTypes = ['hospitals', 'doctors', 'users'];
    if (validTypes.indexOf(type) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'Tipo de colección no válida',
            error: { message: 'Las colecciones validas son: ' + validTypes.join(', ') }
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            message: 'No selecciono nada',
            errors: { message: 'Debe de seleccionar una imagen' }
        });
    }

    // Obtener nombre del archivo
    var file = req.files.image;
    var cutName = file.name.split('.');
    var fileExtension = cutName[cutName.length - 1];

    // Sólo estas extensiones aceptamos
    var validExtensions = ['png', 'jpg', 'gif', 'jpeg'];

    if (validExtensions.indexOf(fileExtension) < 0) {
        return res.status(400).json({
            ok: false,
            mesagge: 'Extension no válida',
            errors: { message: 'Las extensiones válidas son ' + validExtensions.join(', ') }
        });
    }

    // Nombre de archivo personalizado
    var fileName = `${ id }-${ new Date().getMilliseconds() }.${ fileExtension }`;

    // Movel el archivo del temportal a un path
    var path = `./uploads/${ type }/${ fileName }`;

    file.mv(path, err => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al mover achivo',
                errors: { message: err }
            });
        }
        uploadByType(type, id, fileName, res, path);

    });
});


function uploadByType(type, id, fileName, resp, path) {
    if (type === 'users') {
        User.findById(id, (err, user) => {

            if (!user) {
                fs.unlinkSync(path);
                return resp.status(400).json({
                    ok: true,
                    message: 'Usuario no encontrado',
                    errors: { message: 'El usuario con el id ' + id + ' no existe' }
                });
            }

            var oldPath = './uploads/users/' + user.img;

            //Si existe, elimina la imagen anterior
            if (fs.existsSync(oldPath)) {
                fs.unlink(oldPath, (err) => { console.log('Borrado') });
            }


            user.img = fileName;

            user.save((err, updatedUser) => {

                updatedUser.password = '';

                if (err) {
                    return resp.status(400).json({
                        ok: false,
                        error: err
                    });
                }

                return resp.status(200).json({
                    ok: true,
                    message: 'Archivo movido correctamente',
                    user: updatedUser
                });
            });
        });
    }
    if (type === 'doctors') {
        Doctor.findById(id, (err, doctor) => {

            if (!doctor) {
                fs.unlinkSync(path);
                return resp.status(400).json({
                    ok: true,
                    message: 'Medico no encontrado',
                    errors: { message: 'El medico con el id ' + id + ' no existe' }
                });
            }

            var oldPath = './uploads/doctors/' + doctor.img;
            //Si existe, elimina la imagen anterior
            if (fs.existsSync(oldPath)) {
                fs.unlink(oldPath, (err) => { console.log('Borrado') });
            }


            doctor.img = fileName;

            doctor.save((err, updatedDoctor) => {

                if (err) {
                    return resp.status(400).json({
                        ok: false,
                        error: err
                    });
                }

                return resp.status(200).json({
                    ok: true,
                    message: 'Archivo movido correctamente',
                    doctor: updatedDoctor
                });
            });

        });
    }
    if (type === 'hospitals') {

        Hospital.findById(id, (err, hospital) => {

            if (!hospital) {
                fs.unlinkSync(path);
                return resp.status(400).json({
                    ok: true,
                    message: 'Hospital no encontrado',
                    errors: { message: 'El hospital con el id ' + id + ' no existe' }
                });
            }

            var oldPath = './uploads/hospitals/' + hospital.img;
            //Si existe, elimina la imagen anterior
            if (fs.existsSync(oldPath)) {
                fs.unlink(oldPath, (err) => { console.log('Borrado') });
            }




            hospital.img = fileName;

            hospital.save((err, updatedHospital) => {

                if (err) {
                    return resp.status(400).json({
                        ok: false,
                        error: err
                    });
                }

                return resp.status(200).json({
                    ok: true,
                    mensaje: 'Archivo movido correctamente',
                    hospital: updatedHospital
                });
            });

        });

    }
}




module.exports = app;