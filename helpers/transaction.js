const {insertTrans} = require("../config/database")

exports.TransactionHistory = async (payer_id, otherPayer_id,description, type) =>{
    const timestamp = new Date().getTime(); 
    const timestampISOString = new Date(timestamp).toISOString();
    console.log("started inserting")
    await insertTrans(payer_id, otherPayer_id, description, timestampISOString, type);
}