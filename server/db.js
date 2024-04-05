const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/career_sim_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { response } = require('express');
const JWT = process.env.JWT || 'shhh';

const createTables = async () => {
  const SQL = `
  DROP TABLE IF EXISTS carted_products;
  DROP TABLE IF EXISTS products;  
  DROP TABLE IF EXISTS users;

  CREATE TABLE users(
    id UUID DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    payment_info VARCHAR(16),
    is_admin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id)
  );
  CREATE TABLE products(
    id UUID DEFAULT gen_random_uuid(),
    name VARCHAR(20) UNIQUE NOT NULL,
    inventory INTEGER DEFAULT 0,
    price NUMERIC NOT NULL,
    description VARCHAR(255),
    category VARCHAR(25),
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

const createUser = async ({ first_name, last_name, email, password, address, payment_info, is_admin }) => {
  const SQL = `
    INSERT INTO users(id, first_name, last_name, email, password, address, payment_info, is_admin) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), first_name, last_name, email, await bcrypt.hash(password, 5), address, payment_info, is_admin]);
  console.log("Create User");
  return response.rows[0];
};

const createProduct = async ({ name, price, description, category, inventory }) => {
  const SQL = `
    INSERT INTO products(id, name, price, description, category, inventory) VALUES($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name, price, description, category, inventory]);
  console.log("CreatedProduct");
  return response.rows[0];
};

const createCartedProducts = async ({ user_id, product_id, quantity }) => {
  const SQL = `
    INSERT INTO carted_products(id, user_id, product_id, quantity) VALUES($1, $2, $3, $4) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(),user_id, product_id, quantity]);
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
  SELECT * FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
}

const fetchProducts = async () => {
  const SQL = `
  SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
}

const fetchCartedProducts = async ({ user_id }) => {
  const SQL = `
  SELECT * FROM carted_products WHERE user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
}

const fetchSingleProduct = async ({ id }) => {
  const SQL = `
  SELECT * FROM products WHERE id=$1
  `;
  const result = await client.query(SQL, [id]);
  return result.rows[0];
};

const fetchAllCartedProducts = async () => {
  const SQL = `
    SELECT * FROM carted_products
  `;
  const result = await client.query(SQL);
  return result.rows;
};

const updateUser = async ({ id, first_name, last_name, email, password, address, payment_info, is_admin }) => {
  const SQL = `
  UPDATE users
  SET first_name=$2, last_name=$3, email=$4, password=$5, address=$6, payment_info=$7, is_admin=$8
  WHERE id=$1
  RETURNING *
  `
  const response = await client.query(SQL, [id, first_name, last_name, email, password, address, payment_info, is_admin]);
  return response.rows[0];
}

const updateProduct = async ({ id, name, price, description, category, inventory}) => {
  const SQL = `
  UPDATE products
  SET name=$2, price=$3, description=$4, category=$5, inventory=$6
  WHERE id=$1
  RETURNING *
  `;
  const response = await client.query(SQL, [name, price, description, category, inventory, id]);
  return response.rows[0];
}

const updateCartedProducts = async ({ id, user_id, product_id, quantity }) => {
  const SQL = `
  UPDATE carted_products
  SET product_id=$2 AND user_id=$3, quantity=$4
  WHERE id=$1
  RETURNING *
  `;
  const response = await client.query(SQL, [user_id, product_id, quantity]);
  return response.rows[0];
}

const deleteUser = async ({ id }) => {
  const SQL = `
  DELETE FROM users WHERE id=$1
  `;
  await client.query(SQL, [id]);
}

const deleteProduct = async ({ id }) => {
  const SQL = `
  DELETE FROM products WHERE id=$1
  `;
  await client.query(SQL, [id]);
}

const deleteCartedProduct = async ({ id }) => {
  const SQL = `
  DELETE FROM carted_products WHERE id=$1
  `;
  await client.query(SQL, [id]);
}

const authenticate = async ({ email, password }) => {
  const SQL = `
    SELECT id, password, email 
    FROM users WHERE 
    email=$1;
  `;

  const response = await client.query(SQL, [email]);
  if (!response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false) {
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  return { token: token };
};

const findUserWithToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  }
  catch (ex) {
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, email, is_admin FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
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
  fetchSingleProduct,
  fetchAllCartedProducts
};
