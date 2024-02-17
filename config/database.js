const { Client } = require("pg");

const client = new Client({
  // host: "localhost",
  host:'192.168.56.1',
  user: "postgres",
  port: 5432,
  password: "admin",
  database: "Practice",
});

const connectDatabase = async () => {
  await client.connect();
};

const updateProducts = async (uuid, productid, qty, units) => {
  try {
    const query = ` 
    UPDATE basketproduct
    SET qty = ${qty}, units = '${units}'
    WHERE uuid = '${uuid}' AND productid = ${productid};    
    `;
    const response = await client.query(query);
    return response;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const createBag = async (uuid, bag, userid) => {
  try {
    const basketInsertQuery = `
      INSERT INTO Basket (uuid, BasketName)
      VALUES ($1, $2)
      RETURNING uuid;
    `;
    console.log("createBag", uuid)
    console.log(bag)
    const basketResult = await client.query(basketInsertQuery, [uuid, bag]);
    const insertedUuid = basketResult.rows[0].uuid;
    console.log(insertedUuid)
    const basketProductInsertQuery = `
      INSERT INTO BasketProduct (uuid, productId)
      SELECT $1, generate_series(28, 54);
    `;
    console.log(basketProductInsertQuery)
    const response = await client.query(basketProductInsertQuery, [insertedUuid]);
    const userbasketInsert = `INSERT INTO user_basket(uuid, payer_id) VALUES ('${insertedUuid}',${userid})`
    console.log(userbasketInsert)
    await client.query(userbasketInsert)
    return response;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getBasket = async (userid) => {
  try {
    const query = `select * from basket b 
    join user_basket ub on b.uuid = ub.uuid
    where payer_id = ${userid}
    order by basketname`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getcategoryItems = async (category,uuid) => {
  try {
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
 p.name;`;
 console.log(query)
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
const getCategory = async () =>{
  try {
    const query = `select * from category`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const getProducts = async (uuid) => {
  try {
    const query = `SELECT
    c.categoryId AS id,
    c.categoryName AS name,
    c.image AS image,
    json_agg(
        json_build_object(
            'id', p.productId,
            'name', p.name,
            'image', p.image,
            'qty', bp.qty,
            'units', bp.units,
            'price', bp.price,
        ) ORDER BY p.name
    ) AS items
FROM
    Category c
JOIN
    Product p ON c.categoryName = p.category
JOIN
    BasketProduct bp ON p.productId = bp.productId
WHERE
    bp.uuid = '${uuid}'
GROUP BY
    c.categoryId, c.categoryName, c.image
ORDER BY 
    name;
`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getCartitems = async(uuid)=>{
  try {
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
p.name
`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
const updateCartProduct = async (productId, uuid) => {
  try {
    const query = `UPDATE basketproduct
    SET qty = 0
    WHERE uuid = '${uuid}'
      AND qty > 0
      AND productid = ${productId};`;
    const response = await client.query(query);
    console.log(response)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}


const getSearchItems = async (uuid,text)=>{
  try {
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
    p.name;`;
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function insertParticipants(participants) {
  console.log(participants)
  const values = participants.map((participant) => `('${participant.name}', '${participant.phone}')`).join(', ');
  console.log(values)
  const query = `
    INSERT INTO participants (username, phonenumber)
    VALUES ${values}
    ON CONFLICT (phonenumber) DO NOTHING;
  `;
  console.log(query)
  await client.query(query);
}

const createExpense = async (uuid, amount, description, date,splitType,participants,payerPhoneNumber,groupid ) => {
  try {
    console.log("create Expense Started")
    console.log("participants", participants)
    await client.query('BEGIN');
    await insertParticipants(participants);
    console.log("participants", participants)
    const payerIdQuery = `
      SELECT payer_id FROM participants WHERE phonenumber = '${payerPhoneNumber}';
    `;
    console.log(payerIdQuery) 
    const payerResult = await client.query(payerIdQuery);
    console.log(payerResult)
    const payerId = payerResult.rows[0].payer_id;
    const expenseInsertQuery = `
      INSERT INTO expense (expense_id, amount, description, date, payer_id, splitType)
      VALUES ('${uuid}', ${amount}, '${description}',' ${date}', ${payerId}, '${splitType}')
      RETURNING expense_id;
    `;

    console.log(expenseInsertQuery)
    const expenseResult = await client.query(expenseInsertQuery);
    console.log(expenseResult)
    const expenseId = expenseResult.rows[0].expense_id;

    const expenseParticipantsValues = participants.map((person) => {
      return `('${expenseId}', (SELECT payer_id FROM participants WHERE phonenumber = '${person.phone}'), ${person.share},${person.share})`;
    }).join(', ');
    console.log(expenseParticipantsValues)
    const expenseParticipantsInsertQuery = `
      INSERT INTO expenseparticipants (expense_id, payer_id, share,totalshare)
      VALUES ${expenseParticipantsValues} returning payer_id, share;
    `;
    console.log(expenseParticipantsInsertQuery)
    if(groupid){
      await client.query(`INSERT INTO groupTransactions VALUES (${groupid},'${expenseId}')`)
    }

    const response = await client.query(expenseParticipantsInsertQuery);
    await client.query('COMMIT');
    console.log(response)
    console.log('Expense successfully inserted!');
    return response.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    throw e;
  }
};

const getMyexpense = async (myId) =>{
  try {
    const query = `SELECT
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
    console.log(query)
    const response = await client.query(query);

    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const getDetailExpenses = async (userId, payerId) => {
  try {
    const query = ` SELECT
    e.expense_id,
    e.date,
    e.amount as totalAmount,
    CASE WHEN e.payer_id = ${userId} THEN pp.payer_id ELSE lp.payer_id END AS payer_id,
    CASE WHEN e.payer_id = ${userId} THEN pp.phonenumber ELSE lp.phonenumber END AS phonenumber,
    CASE WHEN e.payer_id = 504 THEN pp.username ELSE lp.username END AS username,
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
    ) AND (e.payer_id = ${payerId} OR ep.payer_id = ${payerId}) AND ep.share <> 0 AND ep.isdelete <> 'y';` ;

   console.log(query)
    const response = await client.query(query);
    // console.log(response)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const getMyHistory  = async (userId, payerId) => {
  try {
    const query = ` SELECT
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
    ) AND (e.payer_id = ${payerId} OR ep.payer_id = ${payerId}) AND ep.share = 0 and ep.isdelete <>'y';` ;

   console.log(query)
    const response = await client.query(query);
    // console.log(response)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const groupCreate = async (groupName, addedPeople) =>{
  try {
    await client.query('BEGIN');
    insertParticipants(addedPeople)
    const insertGroup = `INSERT INTO groups (groupname) VALUES ('${groupName}') RETURNING groupid`;
    console.log(insertGroup)
    const groupResult = await client.query(insertGroup);
    const groupid = groupResult.rows[0].groupid;

    const userGroupValues = addedPeople.map((people) => {
      return `('${groupid}', (SELECT payer_id FROM participants WHERE phonenumber = '${people.phone}'))`;
    }).join(', ')
    console.log(userGroupValues)

    const userGroupInsertQuery = `
      INSERT INTO user_group ( groupid, payer_id)
      VALUES ${userGroupValues};
    `;
    console.log(userGroupInsertQuery)
    const response = await client.query(userGroupInsertQuery);
    await client.query('COMMIT');

    return response.rows;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    throw e;
  }
}

const getGroups = async (userId) => {
  try {
    const query = `SELECT g.groupid, g.groupname
    FROM user_group up
    JOIN groups g ON up.groupid = g.groupid
    WHERE up.payer_id = ${userId}`;
    console.log(query)
    const response = await client.query(query);
    console.log(response.rows)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const getGroupPeople = async (groupid) => {
  try {
    const query = `select p.payer_id, p.phonenumber, p.username From user_group ug
    join participants p on ug.payer_id = p.payer_id
    where groupid=${groupid}`;
    const response = await client.query(query);
    console.log(response.rows)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
const getDetailGroups = async (userId,groupid) => {
  console.log(userId,groupid)
  try {
    const query = `SELECT ug.payer_id, ug.groupid,p.phonenumber,p.username
    FROM user_group ug
    JOIN participants p
    on p.payer_id = ug.payer_id
    WHERE ug.groupid IN (
        SELECT g.groupid
        FROM user_group up
        JOIN groups g ON up.groupid = g.groupid
        WHERE up.payer_id = ${userId} and g.groupid=${groupid}
    );`;
    console.log(query)
    const response = await client.query(query);
    console.log(response.rows)
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const groupExpense = async (groupId) => {
  try {
    const query = `select e.expense_id, e.description,e.date,e.amount as share,e.payer_id,p.username from groupTransactions gt
    join expense e on e.expense_id = gt.expense_id
    join participants p on e.payer_id = p.payer_id
    where gt.groupid = ${groupId}`;
    console.log(query)
    const response = await client.query(query);
    return response.rows;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const createUser = async (phoneNumber, email,username, password) => {
  console.log(phoneNumber,email, password)
  try {
    const findPhone = `select payer_id from participants where phonenumber = '${phoneNumber}'`
    const userId = await client.query(findPhone);
    console.log(findPhone)
    console.log(userId)
    let query;
    if(userId.rows[0]){
      query = `update participants set email = '${email}', username='${username}', password='${password}' where payer_id = ${userId.rows[0].payer_id}`;
    }else{
      query = `INSERT INTO PARTICIPANTS (phonenumber, email,username, password) VALUES ('${phoneNumber}', '${email}','${username}' ,'${password}') `;
    }
     await client.query(query);
    console.log(query)
    query2 = `select * From participants where email='${email}'`
    const response = await client.query(query2);
    return response.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const findUser = async (email) => {
  try {
    const query = `select * From participants where email='${email}'`;
    const response = await client.query(query);
    return response.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const findUserByID = async (userId) => {
  try {
    const query = `select payer_id, phonenumber,email,username From participants where payer_id='${userId}'`;
    const response = await client.query(query);
    return response.rows[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
}

const updateExpensePayer = async (expense_id, payer_id, share) => {
  try{
    const query = `update expenseparticipants
    set share = ${share}
    where expense_id = '${expense_id}' and payer_id = ${payer_id}`
    console.log(query)
    const response =  await client.query(query);
    return response.rows[0];
  } catch(e){
    console.error(e);
    throw e;
  }
}

const clearExpense = async (userId, payerId) => {
  try{
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
    );`
    console.log(query)
    const response =  await client.query(query);
    console.log(response)
    return response.rows;
  } catch(e){
    console.error(e);
    throw e;
  }
}

const deleteMyexpenses = async (expense_id,payer_id) => {
  try{
    console.log("i am getting deleted")
    const query = `update expenseparticipants set isdelete = 'y'
    where expense_id = '${expense_id}' and payer_id = ${payer_id}`
    console.log(query)
    const response =  await client.query(query);
    console.log(response)
    return response.rows;
  } catch(e){
    console.error(e);
    throw e;
  }
}

const addGroupContact = async (peoples,groupid) => {
  try{

    const values = peoples.map((people) => `('${people.name}', '${people.phone}')`).join(', ');
    console.log(values)
    const insertQuery = `
      INSERT INTO participants (username, phonenumber)
      VALUES ${values}
      ON CONFLICT (phonenumber) DO NOTHING;
    `;
    await client.query(insertQuery);
    const expenseParticipantsValues = peoples.map((people) => {
      return `((SELECT payer_id FROM participants WHERE phonenumber = '${people.phone}'),${groupid})`;
    }).join(', ');
    console.log(expenseParticipantsValues)

    const query = `insert into user_group  VALUES ${expenseParticipantsValues}`

    console.log(query)
    const response =  await client.query(query);
    console.log(response)
    return response.rows;
  } catch(e){
    console.error(e);
    throw e;
  }
}

const createDeletedExp = async (uuid, updateAmt, description, date, user_id, payer_id) => {
  try{
    const query = `INSERT INTO EXPENSE (expense_id, amount, description, date, payer_id, splitType)
                    VALUES ('${uuid}', ${updateAmt}, '${description}',' ${date}', ${user_id}, 'return amount')
                    `;
    console.log(query);
    await client.query(query);
    const query2 = `
    INSERT INTO expenseparticipants (expense_id, payer_id, share,totalshare)
    VALUES ('${uuid}',${payer_id},${updateAmt}, ${updateAmt} );
  `;
    console.log(query2);
    await client.query(query2);

    const query3 = `
    INSERT INTO expenseparticipants (expense_id, payer_id, share,totalshare)
    VALUES ('${uuid}',${user_id}, ${0}, ${0} );`;
      console.log(query3);
      await client.query(query3);

  } catch(e){
    console.error(e);
    throw e;
  }
}

const deletegroupContact = async (payer_id,groupid) => {
  try{
    console.log(payer_id,groupid)
    const query = `delete from user_group
    where payer_id = ${payer_id} and groupid = ${groupid}`
    console.log(query)
    const response =  await client.query(query);
    console.log(response)
    return response.rows;
  } catch(e){
    console.error(e);
    throw e;
  }
}

const insertTrans = async (payer_id, otherPayer_id, description, date, type) => {
  try{
    console.log("i am inserttrans function")
    const query = `Insert into history( created_id, person_id, date, description, type) Values (${payer_id},${otherPayer_id}, '${date}', '${description}','${type}' )`;
    console.log(query)
    const response = await client.query(query)
    console.log(response);
    return response;
  }catch(e){
    console.error(e);
    throw e;
  }
}

const getMyTransactions = async (payer_id) => {
  try{
    const query = `select * from history where (person_id = ${payer_id}) order by date desc`;
    console.log(query)
    const response = await client.query(query)
    console.log(response);
    return response.rows;
  }catch(e){
    console.error(e);
    throw e;
  }
}

const resetMyPassword = async (email, secret) => {
  try{
    const query = `select * from participants where email='${email}' and secret = '${secret}'`;
    console.log(query)
    const response = await client.query(query)
    console.log(response);
    return response.rows;
  }catch(e){
    console.error(e);
    throw e;
  }
}

const updateMypassword = async (email, password, phonenumber) => {
  try{
    const query = `update participants set password = '${password}' where email='${email}' and phonenumber = '${phonenumber}'`;
    console.log(query)
    const response = await client.query(query)
    console.log(response);
    return response.rows;
  }catch(e){
    console.error(e);
    throw e;
  }
}

module.exports = {
  connectDatabase,
  updateProducts,
  createBag,
  getBasket,
  getProducts,
  getCartitems,
  getcategoryItems,
  getCategory,
  getSearchItems,
  updateCartProduct,
  createExpense,
  getMyexpense,
  getDetailExpenses,
  groupCreate,
  getGroups,
  getDetailGroups,
  createUser,
  findUser,
  findUserByID,
  getGroupPeople,
  groupExpense,
  updateExpensePayer,
  getMyHistory,
  clearExpense,
  deleteMyexpenses,
  addGroupContact,
  deletegroupContact,
  insertTrans,
  getMyTransactions,
  createDeletedExp,
  resetMyPassword,
  updateMypassword
};
