var express = require('express');

var authMiddelware = require('../middlewares/authentication');

var app = express();

var Doctor = require('../models/doctor');

// ==========================================
// Obtener todos los medicos
// ==========================================
app.get('/', (req, res, next) => {
    var from = req.query.from || 0;
    from = Number(from);
    Doctor.find({})
        .populate('user', 'name email')
        .populate('hospital')
        .skip(from)
        .limit(5)
        .exec(
            (err, doctors) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        message: 'Error cargando medicos',
                        errors: err
                    });
                }
                Doctor.count({}, (err, count) => {
                    res.status(200).json({
                        ok: true,
                        found: count,
                        doctors: doctors
                    });
                });
            });
});

// ==========================================
// Obtener medico por id
// ==========================================
app.get('/:id', (req, res, next) => {
    var id = req.params.id;
    Doctor.findById(id)
        .populate('user')
        .populate('hospital')
        .exec((err, doctor) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error al buscar medico',
                    errors: err
                });
            }

            if (!doctor) {
                return res.status(400).json({
                    ok: false,
                    message: 'El medico con el id' + id + 'no existe',
                    errors: { message: 'No existe un medico con ese Id' }
                });
            }
            res.status(200).json({
                ok: true,
                doctor: doctor
            });
        });
});


// ==========================================
// Actualizar hospital
// ==========================================
app.put('/:id', authMiddelware.verifyToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Doctor.findById(id, (err, doctor) => {


        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar medico',
                errors: err
            });
        }

        if (!doctor) {
            return res.status(400).json({
                ok: false,
                message: 'El medico con el id ' + id + ' no existe',
                errors: { message: 'No existe un medico con ese ID' }
            });
        }


        doctor.name = body.name;
        doctor.user = req.user._id;
        doctor.hospital = body.hospital


        doctor.save((err, doctorSaved) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al actualizar medico',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                doctor: doctorSaved
            });

        });

    });

});



// ==========================================
// Crear un nuevo medico
// ==========================================
app.post('/', authMiddelware.verifyToken, (req, res) => {

    var body = req.body;

    var doctor = new Doctor({
        name: body.name,
        user: req.user._id,
        hospital: body.hospital
    });

    doctor.save((err, savedDoctor) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear medico',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            doctor: savedDoctor
        });


    });

});


// ============================================
//   Borrar un medico por el id
// ============================================
app.delete('/:id', authMiddelware.verifyToken, (req, res) => {

    var id = req.params.id;

    Doctor.findByIdAndRemove(id, (err, deletedDoctor) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error borrar medico',
                errors: err
            });
        }

        if (!deletedDoctor) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un medico con ese id',
                errors: { message: 'No existe un medico con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            doctor: deletedDoctor
        });

    });

});


module.exports = app;