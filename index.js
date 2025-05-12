if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
} //we're in development

console.log(process.env.FRUIT)

const express = require('express');
const app = express()
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');

const reviewRoutes = require('./routes/reviews');
const campgroundRoutes = require('./routes/campgrounds');
const userRoutes = require('./routes/users');


app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))


app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname,'public')));

const sessionConfig = {
    secret: 'thisisthesecret',
    resave :false,
    saveUninitialized: true, 
    cookie: {
        expires : Date.now() + 1000*60*60*24*7,
        maxAge : 1000*60*60*24*7
    }
}

app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
.then(()=>{
    console.log("Connected to mongoose");
}).catch((err)=>{
    console.log("Could not connect to mongoose");
    console.log(err);
})

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req,res)=>{
    res.render('home');
})


app.all('*', (req,res,next)=>{
    next(new ExpressError('Page Not Found', 404))
})

app.use((err,req,res,next)=>{
    const {statusCode=500} = err;
    if(!err.message){
        err.message = 'Something went wrong'
    }
    res.status(statusCode).render('error', {err})
})

app.listen('3000', ()=>{
    console.log('APP is LIVE');
})