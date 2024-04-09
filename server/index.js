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

  const dummyData = async () => {
    try{
      const users = await Promise.all([
        createUser({
          first_name:'Joe', 
          last_name:'Rogan', 
          email: 'jrogan@gmail.com', 
          password: 'jr_pop', 
          address: 'Boston', 
          payment_info: 'Debit Card',
          is_admin: true
        }),
        createUser({
          first_name:'Shane', 
          last_name:'Gillis', 
          email: 'sgillis@gmail.com', 
          password: 'sg_pop', 
          address: 'Philadelphia', 
          payment_info: 'Credit Card',
          is_admin: false
        }),
        createUser({
          first_name:'Mark', 
          last_name:'Normand', 
          email: 'mnormand@gmail.com', 
          password: 'mn_pop', 
          address: 'New Orleans', 
          payment_info: 'Debit Card',
          is_admin: false
        }),
        createUser({
          first_name:'Ari', 
          last_name:'Shaffir', 
          email: 'ashaffir@gmail.com', 
          password: 'as_pop', 
          address: 'New York', 
          payment_info: 'Gift Card',
          is_admin: false
        }),
        createUser({
          first_name:'Jaime', 
          last_name:'Vernon', 
          email: 'jvernon@gmail.com', 
          password: 'jv_pop', 
          address: 'California', 
          payment_info: 'Credit Card',
          is_admin: false
        }),

      ]);

      const products = await Promise.all([

         // Electronics
        createProduct({
         name: "Insignia Smart TV",
         description: "INSIGNIA 32-inch Class F20 Series Smart HD 720p Fire TV with Alexa Voice Remote (NS-32F201NA23, 2022 Model)",          
         category: "Electronics",
         inventory: "25",
         price: "$90"
        }),
        createProduct({
         name: "Samsung Smart Phone",
         description: "SAMSUNG Galaxy S24 Cell Phone, 128GB AI Smartphone, Unlocked Android, 50MP Camera, Fastest Processor, Long Battery Life, US Version, 2024, Onyx Black, SM-S921UZKAXAA)",          
         category: "Electronics",
         inventory: "50",
         price: "$800"
        }),
        createProduct({
         name: "Bose Headphones",
         description: "Bose QuietComfort Ultra Wireless Noise Cancelling Headphones with Spatial Audio, Over-the-Ear Headphones with Mic, Up to 24 Hours of Battery Life, Black",          
         category: "Electronics",
         inventory: "40",
         price: "$430"
        }),
        createProduct({
         name: "Hp Laptop",
         description: "HP 17 Inch Laptop Computer, 17.3 FHD Business Laptop, Intel Core i3-N305(8-Core), 32GB RAM, 1TB SSD, Intel UHD Graphics, Fingerprint, WiFi 6, Thin and Light Laptop, Win 11 Home, with Stand",                   
         category: "Electronics",
         inventory: "15",
         price: "$680"
        }),
        createProduct({
         name: "Apple Watch",
         description: "Apple Watch Series 9 [GPS 45mm] Smartwatch with Midnight Aluminum Case with Midnight Sport Band S/M. Fitness Tracker, ECG Apps, Always-On Retina Display, Water Resistant",          
         category: "Electronics",
         inventory: "45",
         price: "$350"
        }),
        // Shoes and Apparel
        createProduct({
         name: "Levi's Men's Jacket",
         description: "Levi's Men's Washed Cotton Hooded Military Jacket (Regular & Big & Tall Sizes)",          
         category: "Shoes and Apparel",
         inventory: "45",
         price: "$72"
        }),
        createProduct({
         name: "Wrangler Jeans",
         description: "Wrangler Authentics Men's Regular Fit Comfort Flex Waist Jean",          
         category: "Shoes and Apparel",
         inventory: "100",
         price: "$35"
        }),
        createProduct({
         name: "Hey Dude Shoes",
         description: "Hey Dude Mens Wally L Stretch Shoest",          
         category: "Shoes and Apparel",
         inventory: "35",
         price: "$60"
        }),
        createProduct({
         name: "Levi's Women's Jeans",
         description: "Levi's Women's Low Pro Jeans",          
         category: "Shoes and Apparel",
         inventory: "30",
         price: "$75"
        }),
        createProduct({
         name: "Crocs",
         description: "Crocs Women’s Brooklyn Low Wedges, Platform Sandalst",          
         category: "Shoes and Apparel",
         inventory: "20",
         price: "$50"
        }),
        // Health & Beauty
        createProduct({
          name: "Olaplex Shampoo",
          description: "Olaplex No. 4 Bond Maintenance Shampoo",          
          category: "Health & Beauty",
          inventory: "100",
          price: "$30"
         }),
        createProduct({
          name: "Paulas Choice Exfoliant",
          description: "Paulas Choice--SKIN PERFECTING 2% BHA Liquid Salicylic Acid Exfoliant--Facial Exfoliant for Blackheads, Enlarged Pores, Wrinkles & Fine Lines, 4 oz Bottle",          
          category: "Health & Beauty",
          inventory: "80",
          price: "$35"
         }),
        createProduct({
          name: "Dr. Squatch Men's Bar Soap",
          description: "Dr. Squatch Men's Bar Soap Gift Set (10 Bars) – Men's Natural Bar Soap - Birchwood Breeze, Fresh Falls, Wood Barrel Bourbon, Coconut Castaway, Cedar Citrus, Bay Rum Soap, and more",          
          category: "Health & Beauty",
          inventory: "75",
          price: "$63"
         }),
        createProduct({
          name: "Old Spice Deodorant",
          description: "Old Spice Antiperspirant Deodorant for Men, Harbor Scent, 48 Hr Odor Protection, 2.6 oz (Pack of 3)",          
          category: "Health & Beauty",
          inventory: "60",
          price: "$25"
         }),
        createProduct({
          name: "Clinique Sunscreen",
          description: "Clinique SPF 50 Mineral Sunscreen Fluid For Face",          
          category: "Health & Beauty",
          inventory: "90",
          price: "$35"
         }),
         // Home Decor 
         createProduct({
          name: "Sweetcrispy Arched Mirror",
          description: "Sweetcrispy Arched Full Length Mirror 64x21 Full Body Mirror Floor Mirror Standing Hanging or Leaning Wall, Large Arch Wall Mirror with Stand Aluminum Alloy Thin Frame",          
          category: "Home Decor",
          inventory: "20",
          price: "$50"
         }),
         createProduct({
          name: "Jonathan Y Rug",
          description: "JONATHAN Y MOH101B-8 Moroccan Hype Boho Vintage Diamond 8 ft. x 10 ft. Area-Rug, Bohemian, Southwestern, Casual, Transitional, Pet Friendly, Non Shedding, Stain Resistant, Easy-Cleaning, Cream/Gray",
          category: "Home Decor",
          inventory: "10",
          price: "$100"
         }),
         createProduct({
          name: "InSimSea Frame",
          description: "InSimSea Framed Vintage Landscape Canvas Wall Art | Wild Field Oil Painting Prints | Cottagecore Bedroom Bathroom Office Decor 24x36inch",          
          category: "Home Decor",
          inventory: "20",
          price: "$65"
         }),
         createProduct({
          name: "Kamjuntar Glass Bud Vase Set",
          description: "Glass Bud Vase Set of 22, Small Vases for Flowers, Clear Centerpieces, Mini in Bulk Rustic Wedding Decorations, Vintage Look Home Table Flower Decor",          
          category: "Home Decor",
          inventory: "15",
          price: "$40"
         }),
         createProduct({
          name: "Kohler Candle",
          description: "Sprig by Kohler Recharge Aromatherapy Candle with Bergamot and Lemongrass, 100% Natural Soy-Coconut Wax, Uplifting and Invigorating Scent, Gift for Holidays, 8 oz",          
          category: "Home Decor",
          inventory: "50",
          price: "$38"
         }),
         //Furniture
         createProduct({
          name: "Yaheetech Recliner Chair",
          description: "Yaheetech Modern Fabric Recliner Chair Sofa Adjustable Single Sofa with Thicker Seat Cushion and Backrest for Living Room Home Theater, Beige",          
          category: "Furniture",
          inventory: "20",
          price: "$70"
         }),
         createProduct({
          name: "Homall Bar Stools",
          description: "Homall Bar Stools Modern PU Leather Adjustable Swivel Barstools, Armless Hydraulic Kitchen Counter Bar Stool Synthetic Leather Extra Height Square Island Barstool with Back Set of 2(Black)",          
          category: "Furniture",
          inventory: "25",
          price: "$75"
         }),
         createProduct({
          name: "HPWLYO Dresser",
          description: "9 Drawer Dresser with LED Light, Tall Fabric Chest of Drawers for Closet, Storage Tower with 3 Shelves, Wide Drawer Organizer Cabinet with Power Outlets for Bedroom, Living Room (Rustic Brown)",          
          category: "Furniture",
          inventory: "10",
          price: "$90"
         }),
         createProduct({
          name: "Wlive Coffee Table",
          description: "WLIVE Wood Lift Top Coffee Table with Hidden Compartment and Adjustable Storage Shelf, Lift Tabletop Dining Table for Home Living Room, Office, Rustic Oak",          
          category: "Furniture",
          inventory: "35",
          price: "$90"
         }),
         createProduct({
          name: "BestOffice Chair",
          description: "Home Office Chair Ergonomic Desk Chair Mesh Computer Chair with Lumbar Support Armrest Executive Rolling Swivel Adjustable Mid Back Task Chair for Women Adults, Black",          
          category: "Furniture",
          inventory: "35",
          price: "$35"
         }),
      ]);

      return {users, products};
    } catch(err){
      console.error(err);
    }    
  };

  // const dummyCartedProducts = await Promise.all([
  //   createCartedProducts({ user_id: joe.id, product_id: hat.id, qty: 1 }),
  //   createCartedProducts({ user_id: shane.id, product_id: shoes.id, qty: 5 }),
  //   createCartedProducts({ user_id: mark.id, product_id: phone.id, qty: 3 }),
  //   createCartedProducts({ user_id: ari.id, product_id: lamp.id, qty: 2 })
  // ]);
  //   console.log(dummyCartedProducts);

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();

