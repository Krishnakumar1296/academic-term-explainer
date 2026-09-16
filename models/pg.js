const { Pool } = require('pg');

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

pgClient.connect();

module.exports = pgClient;
