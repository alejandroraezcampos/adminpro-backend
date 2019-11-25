var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;


// ==========================================
//  Verifyy token
// ==========================================
exports.verifyToken = function(req, res, next) {
    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                message: 'Token incorrecto',
                errors: err
            });
        }
        req.user = decoded.user;
        next();
    });
};

// ==========================================
//  Verify ADMIN
// ==========================================

exports.verifyADMIN = function(req, res, next) {

    var user = req.user;
    if (user.role === 'ADMIN_ROLE') {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            menssage: 'No está autorizado',
            errors: { message: 'No es administrador - No esta autorizado' }
        });
    }
};

// ==========================================
//  Verify Admin o Self User
// ==========================================

exports.verifyADMIN_or_SelfUser = function(req, res, next) {

    var user = req.user;
    var id = req.params.id;
    if (user.role === 'ADMIN_ROLE' || user._id === id) {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            message: 'No está autorizado',
            errors: { message: 'No es administrador o usted mismo - No esta autorizado' }
        });
    }
};