const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/career_sim_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { response } = require('express'); 
const JWT = process.env.JWT || 'shhh';

const createTables = async()=> {
  const SQL = `
  DROP TABLE IF EXISTS carted_products;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS products;
  CREATE TABLE users(
    id UUID DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    payment_info VARCHAR(16),
    is_admin BOOLEAN DEFAULT 0,
    PRIMARY KEY (id)
  );
  CREATE TABLE products(
    id UUID DEFAULT gen_random_uuid(),
    name VARCHAR(20) UNIQUE NOT NULL,
    inventory INTEGER DEAFULT 0,
    price NUMERIC NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id)
  );
  CREATE TABLE carted_products(
    id UUID DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES users(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER DEFAULT 0,
    CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id),
    PRIMARY KEY(id)
    );
  `;
  await client.query(SQL);
};

const createUser = async({ email, password, address, payment_info, is_admin })=> {
  const SQL = `
    INSERT INTO users(id, email, password, address, payment_info, is_admin) VALUES($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), email, await bcrypt.hash(password, 5), address, payment_info, is_admin]);
  return response.rows[0];
};

const createProduct = async({ name, price, description, inventory })=> {
  const SQL = `
    INSERT INTO products(id, name, price, description, inventory) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(),  name, price, description, inventory]);
  return response.rows[0];
};

const createCartedProducts = async({ cart_id, user_id, quantity })=> {
  const SQL = `
    INSERT INTO products(cart_id, product_id, quantity) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, cart_id, user_id,quantity);
  return response.rows[0];
};

const fetchUsers = async() => {
  const SQL = `
  SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
}

const fetchProducts = async() => {
  const SQL = `
  SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
}

const fetchCartedProducts = async({ user_id }) => {
  const SQL = `
  SELECT * FROM carted_products WHERE user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
}

const updateUser = async({ email, password, address, payment_info, is_admin }) => {
  const SQL = `
  UPDATE users
  SET email=$1, password=$2, address=$3, payment_info=$4, is_admin=$5
  WHERE id=$6
  RETURNING *
  `
  const response = await client.query(SQL, [email, password, address, payment_info, is_admin]);
  return response.rows[0];
}

const updateProduct = async({ name, price, description, inventory, id}) => {
  const SQL = `
  UPDATE products
  SET name=$1, price=$2, description=$3, inventory=$4
  WHERE id=$5
  RETURNING *
  `;
  const response = await client.query(SQL, [name, price, description, inventory, id]);
  return response.rows[0];
}

const updateCartedProducts = async({ user_id, product_id, quantity}) => {
  const SQL = `
  UPDATE carted_products
  SET user_id=$1, product_id=$2, quantity=$3
  WHERE id=$4
  RETURNING *
  `;
  const response = await client.query(SQL, [user_id, product_id, quantity]);
  return response.rows[0];
}

const deleteUser = async() => {
  const SQL = `
  DELETE FROM users WHERE id=$1
  `;
  await client.query(SQL, [id]);
}

const deleteProduct = async({ id }) => {
  const SQL = `
  DELETE FROM products WHERE id=$1
  `;
  await client.query(SQL, [id]);
}

const deleteCartedProduct = async({ user_id, id}) => {
  const SQL = `
  DELETE FROM carted_products WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
}
const authenticate = async({ email, password })=> {
  const SQL = `
    SELECT id, password, email 
    FROM users WHERE 
    email=$1;
  `;
  const response = await client.query(SQL, [email]);
  if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password))=== false){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id}, JWT);
  return { token: response.rows[0].id };
};

const findUserWithToken = async(token)=> {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  }
  catch(ex){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, email, is_admin FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if(!response.rows.length){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  createCartedProducts,
  updateUser,
  updateProduct,
  updateCartedProducts,
  deleteUser,
  deleteProduct,
  deleteCartedProduct,
  authenticate,
  findUserWithToken,
  fetchProducts,
  fetchUsers,
  fetchCartedProducts,
};
