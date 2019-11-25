var express = require('express');

var authMiddelware = require('../middlewares/authentication');

var app = express();

var Hospital = require('../models/hospital');

// ==========================================
// Obtener todos los hospitales
// ==========================================
app.get('/', (req, res, next) => {
    var from = req.query.from || 0;
    from = Number(from);
    var to = req.query.to || 5;
    to = Number(to);
    Hospital.find({})
        .populate('user', 'name email img')
        .skip(from)
        .limit(to)
        .exec(
            (err, hospitals) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        message: 'Error cargando hospital',
                        errors: err
                    });
                }

                Hospital.count({}, (err, count) => {
                    res.status(200).json({
                        ok: true,
                        found: count,
                        hospitals: hospitals
                    });
                });
            });
});
// ==========================================
// Obtener hospital por Id
// ==========================================
app.get('/:id', (req, res) => {
    var id = req.params.id;

    Hospital.findById(id)
        .populate('user', 'name img email')
        .exec((err, hospital) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    message: 'Error al buscar usuario',
                    errors: err
                });
            }
            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    message: 'No se encontró hospital por el Id' + id,
                    errors: { message: 'No existen un hospital con ese id' }
                });
            }

            return res.status(200).json({
                ok: true,
                hospital: hospital
            });
        });
});

// ==========================================
// Actualizar hospital
// ==========================================
app.put('/:id', authMiddelware.verifyToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {


        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error al buscar hospital',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(400).json({
                ok: false,
                message: 'El hospital con el id ' + id + ' no existe',
                errors: { message: 'No existe un hospital con ese ID' }
            });
        }


        hospital.name = body.name;
        hospital.user = req.user._id;


        hospital.save((err, hospitalSaved) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    message: 'Error al actualizar hospital',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospitalSaved
            });

        });

    });

});



// ==========================================
// Crear un nuevo hospital
// ==========================================
app.post('/', authMiddelware.verifyToken, (req, res) => {

    var body = req.body;

    var hospital = new Hospital({
        name: body.name,
        user: req.user._id
    });

    hospital.save((err, savedHospital) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Error al crear hospital',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            hospital: savedHospital
        });


    });

});


// ============================================
//   Borrar un hospital por el id
// ============================================
app.delete('/:id', authMiddelware.verifyToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, deletedHospital) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error borrar hospital',
                errors: err
            });
        }

        if (!deletedHospital) {
            return res.status(400).json({
                ok: false,
                message: 'No existe un hospital con ese id',
                errors: { message: 'No existe un hospital con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: deletedHospital
        });

    });

});


module.exports = app;