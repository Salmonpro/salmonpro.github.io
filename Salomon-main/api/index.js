const fs = require("fs");
const express = require("express")
const upload = require("express-fileupload")
const app = express()
app.use(upload())
const sha256 = require("sha256")
const cors = require("cors")
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const session = require("express-session");
const Store = require("connect-mongo")(session);
app.use(cors({
    credentials: true,
    origin: true
}))
app.use(session({
    key: `token`,
    secret: "sdfgj342223dffdbvgfsadfl;fg",
    store: new Store({mongooseConnection: mongoose.connection}),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000
    }
}))
app.use(bodyParser.json())
mongoose.connect("THIS REPLACE", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    poolSize: 5,
    connectTimeoutMS: 10000,
    family: 4,
    useFindAndModify: false
});
mongoose.connection.on('connected', () => {
    console.log('[System] Database connect success!');
});
mongoose.connection.on('err', err => {
    console.log('[System] Database error!\n' + err.stack);
});
mongoose.connection.on('disconnected', () => {
    console.log('[System] Database disconnect success!');
});
const Users = mongoose.model(   "users", new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    points: Number,
    admin: {type: Boolean, default: false},
    completed: Array
}));
const Challanges = mongoose.model("challenges", new mongoose.Schema({
    name: String,
    text: String,
    answer: String,
    points: Number,
    file: String
}));
passport.use(new LocalStrategy({usernameField: 'login', passwordField: "pass", passReqToCallback: true},async function (req, username, password, done) {
    let email = req.body.email
    let name = username
    let pass = await sha256.x2(password);
    let user = await Users.findOne({$or: [{name}, {email}]});
    if (user && !email && user.password !== pass) return done(null, false);
    else if (user && email && user.password === pass) return done(null, false);
    else if (!user && email) user = await Users.create({name, password: pass, points: 0, email});

    if (user && user.password === pass) done(null, user);
    else done(null, false);
}))
passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    Users.findById(id, function (err, user) {
        done(err, user);
    });
});
app.use(passport.initialize());
app.use(passport.session());
app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', function(err, user) {
        if (err) return next(err);
        if (!user) return res.send('err');
        req.logIn(user, function(err) {
            if (err) return next(err);
            return res.send(user);
        });
    })(req, res, next);
});
app.get("/api/info", (req, res, next) => {
    res.json(req.user)
});
app.get("/api/logout", (req, res, next) => {
    req.logout();
    res.send("ok")
});
app.get("/api/leaders", async (req, res, next) => {
    let data = await Users.find({});
    let newData = []
    await data.map(r => {
        r.password = "hide"
        newData.push(r)
    })
    res.json(newData)
});
app.post("/api/challenges", async (req, res, next) => {
    let data = await Challanges.find({});
    if(!req.body.admin || !req.user || !req.user.admin) {
        let hideData = []
        data.forEach(r => {
            r.answer = "hide"
            hideData.push(r)
        })
        res.json(hideData)
    }
    else res.json(data)
});
app.post("/api/admin/delete", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    await Users.findOneAndDelete({name: req.body.name});
    res.send("Ok")
});
app.post("/api/admin/editPoints", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    await Users.findOneAndUpdate({name: req.body.name}, {points: req.body.points});
    res.send("Ok")
});
app.post("/api/admin/setAdmin", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    await Users.findOneAndUpdate({name: req.body.name}, {admin: req.body.admin});
    res.send("Ok")
});
app.post("/api/admin/teams", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    let data = await Users.find({});
    let newData = []
    await data.map(r => {
        r.password = "hide"
        newData.push(r)
    })
    res.json(newData)
});
app.post("/api/admin/deleteChallenge", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    await Challanges.findOneAndDelete({_id: req.body._id});
    res.send("Ok")
});
app.post("/api/ansChallenge", async (req, res, next) => {
    if(!req.user) return res.send("err");
    let challenge = await Challanges.findOne({_id: req.body.id});
    if(!challenge || challenge.answer !== req.body.answer) return res.send("err");
    let user = await Users.findById(req.user._id);
    if(user.completed.includes(challenge._id)) return res.send("err");
    user.completed.push(challenge._id)
    user.points = user.points + challenge.points
    user.save();
    user.passowrd = "hide"
    res.send(user)
});
app.post("/api/admin/createChallenge", async (req, res, next) => {
    if(!req.user || !req.user.admin) return res.send("permissions");
    let text = req.body.text
    let name = req.body.name
    let answer = req.body.answer
    let points = Number(req.body.points)
    let file = req.files && req.files.file && req.files.file
    let ch = await Challanges.create({
        text, name, points, answer, file: file ? file.name.split(".").pop() : false
    });
    if(file) file.mv(`./public/${ch._id}.${file.name.split(".").pop()}`)
    res.send("Ok")
});
app.use("/cdn", express.static('public'));
app.listen(8088, () => console.log("[Server] Started"));
