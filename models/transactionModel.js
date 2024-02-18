const {client} = require("../config/database")
exports.insertTrans = async (payer_id, otherPayer_id, description, date, type) => {
    try{
      const query = `Insert into history( created_id, person_id, date, description, type) Values (${payer_id},${otherPayer_id}, '${date}', '${description}','${type}' )`;
      const response = await client.query(query)
      return response;
    }catch(e){
      console.error(e);
      throw e;
    }
  }