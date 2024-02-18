const { Client } = require("pg");

const client = new Client({
  host: process.env.dbhost,
  user: process.env.dbuser,
  port: process.env.dbport,
  password: process.env.dbpassword,
  database: process.env.database,
});

const connectDatabase = async () => {
  await client.connect();
};

module.exports = {
  connectDatabase,
  client,
};
