const usersModel = require("../models/usersModel.js");

async function getUsers(req, res) {
  try {
    const rows = await usersModel.listUsers();
    console.log(rows);
    return res.json(rows);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Error");
  }
}

module.exports = {
  getUsers,
};
