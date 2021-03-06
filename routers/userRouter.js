const express = require('express');

const mongoose = require('mongoose');

const User = require('../models/user');

const Todo = require('../models/todo');

const userRoute = express.Router();

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const auth = require('../midlewares/auth');

module.exports = userRoute;

//return all users   
userRoute.get('/', async(req, res, next) => {
  try {
    const users = await User.find({}, {password : 0}).exec();
    res.send(users);
    res.statusCode = 200;
  } catch (error) {
    // res.send(error); // the response ends here
    // //because res.send() : sends a response and ends it as well
    // res.statusCode = 422; // So, This line is unreachable

    // So u can do 
    res.status(422).send(error);

    // or i prefer pass this error to the error handling middleware
    // by send it as a parameter to next(error)
    next(error);
  }
});

//sign up a user
userRoute.post('/', async (req, res) => {
  try {

    const { username, fname, password, age } = req.body;
    const hash = await bcrypt.hash(password, 7);
    const user = await User.create({ username, fname, password: hash, age });
    res.send(user);
    res.statusCode = 200;
  }
  catch(err) { 
    console.log(err);
    res.send({sucess: false});
    res.statusCode = 422;
  }
});

//login a user
userRoute.post('/login/', async(req, res) =>{
  try {
    const {username, password} = req.body;
    const user = await User.findOne({username}).exec();
    if(!user) throw new Error({message : "wrong usename or password"});
    const isMatched = await bcrypt.compare(password, user.password);
    if(!isMatched) throw new Error({message : "wrong usename or password"});
    const token = jwt.sign({id: user.id}, 'my-signing-secret');
      res.statusCode = 200;
      res.send(token);
  } catch (err) {
    console.log(err);
    res.send({sucess: false});
    res.statusCode = 422;
  }
});


userRoute.use(auth);


//delete a user using authentication token

userRoute.delete('/', async(req, res) =>{
  try {
    const id = req.signedData.id;
    await User.deleteOne({_id: id});
    await Todo.deleteMany({userId:id});
    res.send({message : 'user deleted'});
    res.statusCode = 200;
  } catch (err) {
    res.send({message: 'deletion falied'});
    res.statusCode = 422;
  }
});


//show user Profile and Todos
userRoute.get('/profile', async(req, res) =>{
  try {
    const id = req.signedData.id;
    const user = await User.findOne({_id: id}, {password : 0});
    const todos = await Todo.find({userId : id})
    res.send({user: user, todos : todos});
    res.statusCode = 200;
  } catch (error) {
    res.send(error);
    res.statusCode = 422;
  }
});

//edit user profile
userRoute.patch('/', async(req, res) => {
  try {
    const _id = req.signedData.id;
    const { username, fname, password, age } = req.body;
    const editedUser = await User.updateOne({_id}, {username, fname, password, age});
    res.send({editedUser: editedUser});
    res.statusCode = 200;
  } catch (err) {
    res.send({message: 'edit failed'});
    res.statusCode = 422;
  }
});