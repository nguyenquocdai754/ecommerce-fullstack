const model = require("../models/dashboardModel");

const getSummary = async (_req, res, next) => {
  try { return res.json({ success: true, data: await model.getSummary() }); }
  catch (error) { return next(error); }
};

module.exports = { getSummary };
