const {insertTrans} = require("../models/transactionModel")

exports.TransactionHistory = async (payer_id, otherPayer_id,description, type) =>{
    const timestamp = new Date().getTime(); 
    const timestampISOString = new Date(timestamp).toISOString();
    await insertTrans(payer_id, otherPayer_id, description, timestampISOString, type);
}