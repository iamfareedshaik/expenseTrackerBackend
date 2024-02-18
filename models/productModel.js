const { client } = require("../config/database");

async function executeInTransaction(func) {
    try {
        await client.query('BEGIN');
        const result = await func();
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        throw e;
    }
}

exports.updateCartProduct = async (productId, uuid) => {
    return executeInTransaction(async () => {
        const query = `UPDATE basketproduct
        SET qty = 0
        WHERE uuid = '${uuid}'
        AND qty > 0
        AND productid = ${productId};`;
        const response = await client.query(query);
        return response.rows;
    });
};

exports.getCartitems = async (uuid) => {
    return executeInTransaction(async () => {
        const query = `SELECT
        p.productId,
        p.name,
        p.image,
        bp.qty,
        bp.units,
        bp.price
    FROM
        BasketProduct bp
    JOIN
        Product p ON bp.productId = p.productId
    WHERE
        bp.qty > 0 and bp.uuid = '${uuid}'
    ORDER BY 
        p.name`;
        const response = await client.query(query);
        return response.rows;
    });
};

exports.getCategory = async () => {
    return executeInTransaction(async () => {
        const query = `select * from category`;
        const response = await client.query(query);
        return response.rows;
    });
};

exports.getcategoryItems = async (category, uuid) => {
    return executeInTransaction(async () => {
        const query = `SELECT
        p.productId,
        p.name,
        p.image,
        bp.qty,
        bp.units,
        bp.price
    FROM
        Product p
    JOIN
        BasketProduct bp ON p.productId = bp.productId
    WHERE
        bp.uuid = '${uuid}' and p.category = '${category}'
    ORDER BY 
        p.name`;
        const response = await client.query(query);
        return response.rows;
    });
};

exports.getSearchItems = async (uuid, text) => {
    return executeInTransaction(async () => {
        const query = `SELECT
        p.productId,
        p.name,
        p.image,
        bp.qty,
        bp.units,
        bp.price
    FROM
        Product p
    JOIN
        BasketProduct bp ON p.productId = bp.productId
    WHERE
        bp.uuid = '${uuid}'
        AND p.name ILIKE '%${text}%'
    ORDER BY 
        p.name`;
        const response = await client.query(query);
        return response.rows;
    });
};
