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

exports.findUser = async (email) => {
    return executeInTransaction(async () => {
        const query = `select * From participants where email='${email}'`;
        const response = await client.query(query);
        return response.rows[0];
    });
};

exports.createUser = async (phoneNumber, email, username, password, secret) => {
    return executeInTransaction(async () => {
        const findPhone = `select payer_id from participants where phonenumber = '${phoneNumber}'`;
        const userId = await client.query(findPhone);
        let query;
        if (userId.rows[0]) {
            query = `update participants set email = '${email}', username='${username}', password='${password}' where payer_id = ${userId.rows[0].payer_id}`;
        } else {
            query = `INSERT INTO PARTICIPANTS (phonenumber, email,username, password, secret) VALUES ('${phoneNumber}', '${email}','${username}' ,'${password}', '${secret}') `;
        }
        await client.query(query);
        const query2 = `select * From participants where email='${email}'`;
        const response = await client.query(query2);
        return response.rows[0];
    });
};

exports.findUserByID = async (userId) => {
    return executeInTransaction(async () => {
        const query = `select payer_id, phonenumber,email,username From participants where payer_id='${userId}'`;
        const response = await client.query(query);
        return response.rows[0];
    });
};

exports.resetMyPassword = async (email, secret) => {
    return executeInTransaction(async () => {
        const query = `select * from participants where email='${email}' and secret = '${secret}'`;
        const response = await client.query(query);
        return response.rows;
    });
};

exports.updateMypassword = async (email, password, phonenumber) => {
    return executeInTransaction(async () => {
        const query = `update participants set password = '${password}' where email='${email}' and phonenumber = '${phonenumber}'`;
        const response = await client.query(query);
        return response.rows;
    });
};
