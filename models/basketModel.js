const { client } = require("../config/database");

exports.createBag = async (uuid, bag, userid) => {
  try {
    await client.query("BEGIN");
    const basketInsertQuery = `
            INSERT INTO Basket (uuid, BasketName)
            VALUES ($1, $2)
            RETURNING uuid;
        `;
    const basketResult = await client.query(basketInsertQuery, [uuid, bag]);
    const insertedUuid = basketResult.rows[0].uuid;
    const basketProductInsertQuery = `
            INSERT INTO BasketProduct (uuid, productId)
            SELECT $1, generate_series(1, 90);
        `;
    await client.query(basketProductInsertQuery, [insertedUuid]);
    const userbasketInsert = `INSERT INTO user_basket(uuid, payer_id) VALUES ($1, $2)`;
    await client.query(userbasketInsert, [insertedUuid, userid]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    throw e;
  }
};

exports.getBasket = async (userid) => {
  try {
    const query = `
            SELECT * FROM basket b 
            JOIN user_basket ub ON b.uuid = ub.uuid
            WHERE payer_id = $1
            ORDER BY basketname
        `;
    const response = await client.query(query, [userid]);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.updateProducts = async (uuid, productid, qty, units) => {
  try {
    await client.query("BEGIN");
    const query = `
            UPDATE basketproduct
            SET qty = $1, units = $2
            WHERE uuid = $3 AND productid = $4
        `;
    await client.query(query, [qty, units, uuid, productid]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    throw e;
  }
};
