const { HttpError } = require('../utils/http')
module.exports.authorizeRoles = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'Access denied'))
