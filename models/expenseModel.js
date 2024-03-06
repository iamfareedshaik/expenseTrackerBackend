const { client } = require("../config/database");

async function executeInTransaction(func) {
  try {
    await client.query("BEGIN");
    const result = await func();
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    throw e;
  }
}

async function insertParticipants(participants) {
  const values = participants
    .map((participant) => `('${participant.name}', '${participant.phone}')`)
    .join(", ");
  const query = `
      INSERT INTO participants (username, phonenumber)
      VALUES ${values}
      ON CONFLICT (phonenumber) DO NOTHING;
    `;
  await client.query(query);
}

exports.createExpense = async (
  uuid,
  amount,
  description,
  date,
  splitType,
  participants,
  payerPhoneNumber,
  groupid
) => {
  return executeInTransaction(async () => {
    await insertParticipants(participants);
    const payerIdQuery = `
          SELECT payer_id FROM participants WHERE phonenumber = '${payerPhoneNumber}';
        `;
    const payerResult = await client.query(payerIdQuery);
    const payerId = payerResult.rows[0].payer_id;

    const expenseInsertQuery = `
          INSERT INTO expense (expense_id, amount, description, date, payer_id, splitType)
          VALUES ('${uuid}', ${amount}, '${description}', '${date}', ${payerId}, '${splitType}')
          RETURNING expense_id;
        `;
    const expenseResult = await client.query(expenseInsertQuery);
    const expenseId = expenseResult.rows[0].expense_id;

    const expenseParticipantsValues = participants
      .map((person) => {
        return `('${expenseId}', (SELECT payer_id FROM participants WHERE phonenumber = '${person.phone}'), ${person.share}, ${person.share})`;
      })
      .join(", ");

    const expenseParticipantsInsertQuery = `
          INSERT INTO expenseparticipants (expense_id, payer_id, share, totalshare)
          VALUES ${expenseParticipantsValues} returning payer_id, share;
        `;

    if (groupid) {
      await client.query(
        `INSERT INTO groupTransactions VALUES (${groupid},'${expenseId}')`
      );
    }

    const response = await client.query(expenseParticipantsInsertQuery);
    return response.rows;
  });
};

exports.getMyTransactions = async (payer_id) => {
  try {
    const query = `select * from history where (person_id = ${payer_id}) order by date desc`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.getDetailExpenses = async (userId, payerId) => {
  try {
    const query = `
        SELECT
            e.expense_id,
            e.date,
            e.amount as totalAmount,
            CASE WHEN e.payer_id = ${userId} THEN lp.payer_id ELSE pp.payer_id END AS payer_id,
            CASE WHEN e.payer_id = ${userId} THEN lp.phonenumber ELSE pp.phonenumber END AS phonenumber,
            CASE WHEN e.payer_id = ${userId} THEN lp.username ELSE pp.username END AS username,
            ep.share * CASE WHEN e.payer_id = ${userId} THEN 1 ELSE -1 END  AS share,
            ep.totalshare as actualShare,
            e.description
        FROM
            expense e
            JOIN expenseparticipants ep ON ep.expense_id = e.expense_id
            JOIN participants lp ON e.payer_id = lp.payer_id -- Join for login user (payer)
            JOIN participants pp ON ep.payer_id = pp.payer_id -- Join for participant (person owed)
        WHERE
            (
            (e.payer_id = ${userId} AND ep.payer_id <> ${userId})  -- Login user needs to pay
            OR (ep.payer_id = ${userId} AND e.payer_id <> ${userId}) -- Login user is owed
            ) AND (e.payer_id = ${payerId} OR ep.payer_id = ${payerId}) AND ep.share <> 0 AND ep.isdelete <> 'y';`;

    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

exports.getMyexpense = async (myId) => {
  return executeInTransaction(async () => {
    const query = `
        SELECT
            CASE WHEN e.payer_id = ${myId} THEN pp.payer_id ELSE lp.payer_id END AS payer_id,
            CASE WHEN e.payer_id = ${myId} THEN pp.username ELSE lp.username END AS username,
            CASE WHEN e.payer_id = ${myId} THEN pp.phonenumber ELSE lp.phonenumber END AS phonenumber,
            sum(CASE WHEN ep.isdelete = 'y' THEN 0 ELSE ep.share * CASE WHEN (e.payer_id = ${myId}) THEN 1 ELSE -1 END END) AS total_amount
        FROM
            expense e
            JOIN expenseparticipants ep ON ep.expense_id = e.expense_id
            JOIN participants lp ON e.payer_id = lp.payer_id -- Join for login user (payer)
            JOIN participants pp ON ep.payer_id = pp.payer_id -- Join for participant (person owed)
        WHERE
            (e.payer_id = ${myId} AND ep.payer_id <> ${myId})  -- Login user needs to pay
            OR (ep.payer_id = ${myId} AND e.payer_id <> ${myId}) -- Login user is owed
        GROUP BY
            CASE WHEN e.payer_id = ${myId} THEN pp.phonenumber ELSE lp.phonenumber END,
            CASE WHEN e.payer_id = ${myId} THEN pp.username ELSE lp.username END,
            CASE WHEN e.payer_id = ${myId} THEN pp.payer_id ELSE lp.payer_id END
        `;
    const response = await client.query(query);
    return response.rows;
  });
};

exports.updateExpensePayer = async (expense_id, payer_id, share) => {
  return executeInTransaction(async () => {
    const query = `update expenseparticipants
        set share = ${share}
        where expense_id = '${expense_id}' and payer_id = ${payer_id}`;
    const response = await client.query(query);
    return response.rows[0];
  });
};

exports.getMyHistory = async (userId, payerId) => {
  return executeInTransaction(async () => {
    const query = `
        SELECT
            e.expense_id,
            e.date,
            e.amount as totalAmount,
            CASE WHEN e.payer_id = ${userId} THEN pp.payer_id ELSE lp.payer_id END AS payer_id,
            CASE WHEN e.payer_id = ${userId} THEN pp.phonenumber ELSE lp.phonenumber END AS phonenumber,
            CASE WHEN e.payer_id = ${userId} THEN pp.username ELSE lp.username END AS username,
            ep.totalshare * CASE WHEN e.payer_id = ${userId} THEN 1 ELSE -1 END  AS share,
            e.description
        FROM
            expense e
            JOIN expenseparticipants ep ON ep.expense_id = e.expense_id
            JOIN participants lp ON e.payer_id = lp.payer_id -- Join for login user (payer)
            JOIN participants pp ON ep.payer_id = pp.payer_id -- Join for participant (person owed)
        WHERE
            (
            (e.payer_id = ${userId} AND ep.payer_id <> ${userId})  -- Login user needs to pay
            OR (ep.payer_id = ${userId} AND e.payer_id <> ${userId}) -- Login user is owed
            ) AND (e.payer_id = ${payerId} OR ep.payer_id = ${payerId}) AND ep.share = 0 and ep.isdelete <>'y';`;
    const response = await client.query(query);
    return response.rows;
  });
};

exports.clearExpense = async (userId, payerId) => {
  return executeInTransaction(async () => {
    const query = `UPDATE expenseparticipants
        SET share = 0
        WHERE (expense_id, payer_id) IN (
            SELECT ep.expense_id, ep.payer_id
            FROM expense e
            JOIN expenseparticipants AS ep ON ep.expense_id = e.expense_id
            WHERE (
                (e.payer_id = ${userId} AND ep.payer_id <> ${userId}) -- Login user needs to pay
                OR (ep.payer_id = ${userId} AND e.payer_id <> ${userId}) -- Login user is owed
            ) AND (e.payer_id = ${payerId} OR ep.payer_id = ${payerId})
        );`;
    const response = await client.query(query);
    return response.rows;
  });
};

exports.deleteMyexpenses = async (expense_id, payer_id) => {
  return executeInTransaction(async () => {
    const query = `update expenseparticipants set isdelete = 'y'
        where expense_id = '${expense_id}' and payer_id = ${payer_id}`;
    const response = await client.query(query);
    return response.rows;
  });
};

exports.createDeletedExp = async (
  uuid,
  updateAmt,
  description,
  date,
  user_id,
  payer_id
) => {
  return executeInTransaction(async () => {
    const query = `INSERT INTO EXPENSE (expense_id, amount, description, date, payer_id, splitType)
                        VALUES ('${uuid}', ${updateAmt}, '${description}',' ${date}', ${user_id}, 'return amount')
                        `;
    await client.query(query);
    const query2 = `
        INSERT INTO expenseparticipants (expense_id, payer_id, share,totalshare)
        VALUES ('${uuid}',${payer_id},${updateAmt}, ${updateAmt} );
      `;
    await client.query(query2);

    const query3 = `
        INSERT INTO expenseparticipants (expense_id, payer_id, share,totalshare)
        VALUES ('${uuid}',${user_id}, ${0}, ${0} );`;
    await client.query(query3);
  });
};
