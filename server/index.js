const {
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
  fetchUsers,
  fetchProducts,
  fetchCartedProducts,
  authenticate,
  findUserWithToken
} = require('./db');
const express = require('express');
const { register } = require('module');
const app = express();
app.use(express.json());

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

const isLoggedIn = async(req, res, next)=> {
  try {
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};
const isAdmin = async(req, res, next)=> {
  try {
      if(!req.user.is_admin){
        res.status(401).send("Error");
      }
    next();
  }
  catch(ex){
    next(ex);
  }
};

app.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/auth/register', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth/me', isLoggedIn, async(req, res, next)=> {
  try {
   res.send(await findUserWithToken(req.headers.authorization));   
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users',isLoggedIn, async(req, res, next)=> {
  try {
    res.send(await fetchUsers());
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/cartedProducts', isLoggedIn, async(req, res, next)=> {
  try {
       res.send(await fetchCartedProducts(req.params.id));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/products', async (req, res, next) => {
  try{
    res.send(await fetchProducts());
    } 
    catch(ex){
      next(ex);
    }
});

app.post('/api/users/:id/products', isAdmin, async(req, res, next)=> {
  try {
        res.status(201).send(await createProduct(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/users/:user_id/product/:id', isLoggedIn, isAdmin, async(req, res, next)=> {
  try {
       res.status(201).send(await updateProduct({...req.body, id: req.params.id}));
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/user/:id', isLoggedIn, async (req, res, next) => {
  try {
    res.status(201).send(await updateUser(req.body));
  } catch (ex) {
    next(ex);
  }
});

app.put('/api/user/:userId/cartedProducts/:id', isLoggedIn, async (req, res, next) => {
  try{
    res.status(201).send(await updateCartedProducts(req.body));
  } 
  catch(ex){
    next(ex);
  }
});

app.delete('/api/user/:id/products/:id', isLoggedIn, isAdmin, async (req, res, next) => {
  try{
    res.status(204).send(await deleteProduct(req.params.id));
  } 
  catch(ex){
    next(ex);
  }
});

app.post('/api/users/:id/cartedProducts', isLoggedIn, async (req, res, next) => {
  try {
    res.status(201).send(await createCartedProducts({ user_id: req.params.id, product_id: req.body.product_id }));
  }
  catch (ex) {
    next(ex);
  }
});

app.delete('/api/users/:user_id/cartedProduct/:id', isLoggedIn, async (req, res, next) => {
  try {
    await deleteCartedProduct({ user_id: req.params.user_id, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

const init = async()=> {
  const port = process.env.PORT || 3000;
  await client.connect();
  console.log('connected to database');

  await createTables();
  console.log('tables created');

  const [joe, shane, mark, ari, hat, phone, shoes, laptop, lamp] = await Promise.all([
    createUser({ email: 'joe@gmail.com', password: 'j_pop', address: 'Boston', is_admin: true}),
    createUser({ email: 'shane@gmail.com', password: 's_pop', address: 'Philadelphia', is_admin: false}),
    createUser({ email: 'mark@gmail.com', password: 'm_pop', address: 'New Orleans', is_admin: false}),
    createUser({ email: 'ari@gmail.com', password: 'a_pop', address:'Los Angeles', is_admin: false}),
    createProduct({ name: 'hat', price: 15, description: 'Fancy Hat', inventory: 25}),
    createProduct({ name: 'phone', price: 200, description: 'Smart Phone', inventory: 50 }),
    createProduct({ name: 'shoes', price: 75, description: 'Athletic Shoes', inventory: 30 }),
    createProduct({ name: 'laptop', price: 500, description: 'Gaming Laptop', inventory: 15 }),
    createProduct({ name: 'lamp', price: 25, description: 'Table Lamp', inventory: 60 })
  ]);

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();

