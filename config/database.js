const { Client } = require("pg");

const client = new Client({
  host: "expensetracker.cxw2smec0whe.us-east-2.rds.amazonaws.com",
  user: "FareedDatabase",
  port: 5432,
  password: "6A2A7992",
  database: "ExpenseTracker",
});

const connectDatabase = async () => {
  await client.connect();
};

module.exports = {
  connectDatabase,
  client,
};
