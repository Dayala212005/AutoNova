const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const ROLES = ['comprador', 'vendedor', 'admin'];

const esEnteroPositivo = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

module.exports = { wrap, ROLES, esEnteroPositivo };