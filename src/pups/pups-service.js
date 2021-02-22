const PupsService = {
  getAllPups(knex) {
    return knex.select("*").from("pups");
  },
  getById(knex, id) {
    return knex.from("pups").select("*").where("id", id).first();
  },
  getUserPups(knex, id) {
    return knex.from("pups").select("*").where("owner", id);
  },
  insertPup(knex, newPup) {
    return knex
      .insert(newPup)
      .into("pups")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  deletePup(knex, id) {
    return knex("pups").where({ id }).delete();
  },
  updatePup(knex, id, newPupFields) {
    return knex("pups").where({ id }).update(newPupFields);
  },
};

module.exports = PupsService;
