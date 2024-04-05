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
  fetchSingleProduct,
  fetchAllCartedProducts,
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
    res.send(await createUser(req.body));
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

app.get('/api/products', async (req, res, next) => {
  try{
    res.send(await fetchProducts());
    } 
    catch(ex){
      next(ex);
    }
});

app.get('/api/users/:userId/cartedProducts', async(req, res, next)=> {
  try {
       res.send(await fetchCartedProducts(req.params.id));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/product/:id', async (req, res, next) => {
  try {
    res.send(await fetchSingleProduct({id: req.params.id}));
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/cartedProducts', isAdmin, isLoggedIn, async (req, res, next) => {
  try {
    res.send(await fetchAllCartedProducts());
  }
  catch (ex) {
    next(ex);
  }
});

app.post('/api/products', isAdmin, isLoggedIn, async(req, res, next)=> {
  try {
        res.status(201).send(await createProduct(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/product/:id', isLoggedIn, isAdmin, async(req, res, next)=> {
  try {
       res.status(201).send(await updateProduct({...req.body, id: req.params.id}));
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/user/:id', isLoggedIn, async (req, res, next) => {
  try {
    res.status(201).send(await updateUser({...req.body, id: req.params.id}));
  } catch (ex) {
    next(ex);
  }
});

app.put('/api/user/:userId/product/:id/cartedProducts', isLoggedIn, async (req, res, next) => {
  try{
    res.status(201).send(await updateCartedProducts({quantity: req.body.quantity, user_id:req.params.userId, product_id:req.params.product_id}));
  } 
  catch(ex){
    next(ex);
  }
});

app.delete('/api/user/:id', isLoggedIn, async (req, res, next) => {
  try {
    res.status(204).send(await deleteUser({id: req.params.id}));
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/products/:id', isLoggedIn, isAdmin, async (req, res, next) => {
  try{
    res.status(204).send(await deleteProduct({id:req.params.id}));
  } 
  catch(ex){
    next(ex);
  }
});

app.post('/api/users/:userId/cartedProducts', isLoggedIn, async (req, res, next) => {
  try {
    res.status(201).send(await createCartedProducts({ user_id: req.params.userId, product_id: req.body.product_id, quantity: req.body.quantity }));
  }
  catch (ex) {
    next(ex);
  }
});

app.delete('/api/users/:userId/product/:id/cartedProduct/', isLoggedIn, async (req, res, next) => {
  try {
    await deleteCartedProduct({ user_id: req.params.userId, product_id: req.params.id });
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
    createUser({ first_name:'Joe', last_name:'Rogan', email: 'joe@gmail.com', password: 'j_pop', address: 'Boston', is_admin: true}),
    createUser({ first_name:'Shane', last_name:'Gillis', email: 'shane@gmail.com', password: 's_pop', address: 'Philadelphia', is_admin: false}),
    createUser({ first_name:'Mark', last_name:'Normand', email: 'mark@gmail.com', password: 'm_pop', address: 'New Orleans', is_admin: false}),
    createUser({ first_name:'Ari', last_name:'Shaffir', email: 'ari@gmail.com', password: 'a_pop', address:'Los Angeles', is_admin: false}),

    createProduct({ name: 'hat', price: 15, description: 'Fancy Hat', inventory: 25}),
    createProduct({ name: 'phone', price: 200, description: 'Smart Phone', inventory: 50 }),
    createProduct({ name: 'shoes', price: 75, description: 'Athletic Shoes', inventory: 30 }),
    createProduct({ name: 'laptop', price: 500, description: 'Gaming Laptop', inventory: 15 }),
    createProduct({ name: 'lamp', price: 25, description: 'Table Lamp', inventory: 60 })
  ]);

  const dummyCartedProducts = await Promise.all([
    createCartedProducts({ user_id: joe.id, product_id: hat.id, qty: 1 }),
    createCartedProducts({ user_id: shane.id, product_id: shoes.id, qty: 5 }),
    createCartedProducts({ user_id: mark.id, product_id: phone.id, qty: 3 }),
    createCartedProducts({ user_id: ari.id, product_id: lamp.id, qty: 2 })
  ]);
    console.log(dummyCartedProducts);

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();

