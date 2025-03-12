const express = require("express");
var cookieParser = require("cookie-parser");
const puppeteer = require("puppeteer"); 

const app = express();
const app_html = express();

app_html.use(express.static("styles"));

app.set("view engine", "ejs");
app_html.set("view engine", "ejs");

app.use(express.static("styles"));
app.use(cookieParser());

var db = {"admin": createSessionValue()};
var sessions = {};
const urlEncodedParser = express.urlencoded({extended: false});
var users_pages = {};
var posts_sessions = {};
chat_answer = "Please, give me page name";

let browser;
var bot_cookie;
(async () => {
    browser = await puppeteer.launch({headless: true, executablePath: "/usr/bin/google-chrome", args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`]});
    const page = await browser.newPage();
    await page.goto('http://cab.local/login');
    await page.type("#floatingInput", "admin");
    await page.type("#floatingPassword", db["admin"]);
    await page.click("#submitForm");
    await page.waitForNavigation();
    await page.goto("http://posts.local/login")
    await page.type("#floatingInput", "admin");
    await page.type("#floatingPassword", db["admin"]);
    await page.click("#submitForm");
    await page.waitForNavigation();
    bot_cookie = await browser.cookies();
    console.log("Bot ready");
}) ();

function createSessionValue() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let counter = 0;
    while (counter < 30) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
      counter += 1;
    }
    return result;
}

function checkPasswordCorrect(password){
    pass_symbols = "qwertyuiopasdfghjklzxcvbnm1234567890!@#$%";
    password = password.toLowerCase();
    for(let i = 0; i < password.length; i++){
        if(pass_symbols.indexOf(password[i]) == -1){
            return false;
        }
    }
    return true;
}

function reloadAdminPassword(){
    db["admin"] = createSessionValue();
}

setInterval(reloadAdminPassword, 300000);

app.get("/", function(request, response){
    response.redirect("login");
});

app.get("/login", function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.sendFile(__dirname + "/login.html");
    }
    else{
        response.redirect("account");
    }
});

app.get("/register", function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.sendFile(__dirname + "/register.html");
    }
    else{
        if(request.cookies.session in sessions){
            response.redirect("account");
        }
    }
});

app.get("/account", function(request, response){
    if(request.get("Cookie") === undefined || !(request.cookies.session in sessions)){
        response.clearCookie("session");
        response.redirect("login");
    }
    else{
        user_login = sessions[request.cookies.session];
        user_flag = "Here not flag("
        if(user_login == "admin"){
            user_flag = process.env.FLAG;
        }
        response.render("account", {name: user_login, ctf_flag: user_flag, admin_message: chat_answer});
    }
    chat_answer = "Please, give me page name";
});

app.post("/api/get_user", urlEncodedParser, function(request, response){
    var user_login = request.body.login;
    var user_password = request.body.password;
    if(user_login in db){
        if(user_password == db[user_login]){
            cookie_value = createSessionValue();
            response.cookie("session", cookie_value, {httpOnly: true, sameSite: "lax"});
            sessions[cookie_value] = user_login;
            response.redirect("/account");
        }
        else{
            response.status(400).send("Incorrect password");
        }
    }
    else{
        response.status(400).send("Not such account");
    }
});

app.post("/api/create_user", urlEncodedParser, function(request, response){
    if(request.body.login in db){
        response.status(400).send("User has exist");
    }
    else if(request.body.password == request.body.repeat_password){
        if(checkPasswordCorrect(request.body.password)){
            var user_login = request.body.login;
            var user_password = request.body.password;
            db[user_login] = user_password;
            cookie_value = createSessionValue();
            response.cookie("session", cookie_value, {maxAge: 900000, httpOnly: true, sameSite: "lax"});
            sessions[cookie_value] = user_login;
            response.redirect("/account");
        }
        else{
            response.status(400).send("Incorrect password's syntax");
        }
    }
    else{
        response.status(400).send("Passwords don't match");
    }
});

app.get("/api/logout", function(request, response){
    user_session = request.get("Cookie").substring(8);
    delete sessions[user_session];
    response.clearCookie("session");
    response.redirect("/login");
});

app.post("/api/change-password", urlEncodedParser, function(request, response){
    if(checkPasswordCorrect(request.body.password) && request.get("Cookie") !== undefined){
        user_login = sessions[request.cookies.session];
        db[user_login] = request.body.password;
        response.status(200).send("Password was changed");
    }
    else{
        response.status(400).send("Incorrect password's syntax");
    }
});

app.get("/api/change-password", function(request, response){
    if(checkPasswordCorrect(request.query.password) && request.get("Cookie") !== undefined){
        user_login = sessions[request.cookies.session];
        db[user_login] = request.query.password;
        response.status(200).send("Password was changed");
    }
    else{
        response.status(400).send("Incorrect password's syntax");
    }
});

app.post("/chat-post", urlEncodedParser, async function(request, response){
    user_message = request.body.message;
    user_login = sessions[request.cookies.session];
    if(users_pages[user_login] !== undefined && users_pages[user_login][user_message] !== undefined){
        chat_answer = "Checked!";
        //response.render("account", {name: user_login, ctf_flag: "Here not flag(", admin_message: "Checked!"});
        page_content = users_pages[user_login][user_message];
        const page = await browser.newPage();
        //await page.setJavaScriptEnabled(true);
        const res = await page.goto("http://posts.local/page?name="+user_message+"&check_user="+user_login);
        const result = await page.evaluate(() => {
            return document.documentElement.outerHTML;
        });
        //response.render("account", {name: user_login, ctf_flag: "Here not flag(", admin_message: "Checked!"});
    }
    else{
        chat_answer = "Not such page(";
        //response.render("account", {name: user_login, ctf_flag: "Here not flag(", admin_message: "Not such page("});
    }
    // users_messages[user_login] = user_message;
    // page_content = users_pages[user_login][user_message];
    response.redirect("account");
})

app.listen(5000, function(){
    console.log("Listen on 5000...");
});






app_html.get("/", function(request, response){
    response.redirect("login");
});

app_html.get("/login", function(request, response){
    if(request.get("Cookie") === undefined || !(request.get("Cookie").substring(8) in posts_sessions)){
        response.sendFile(__dirname + "/page_login.html");
    }
    else{
        response.redirect("/creator");
    }
});

app_html.post("/api/get_user", urlEncodedParser, function(request, response){
    var user_login = request.body.login;
    var user_password = request.body.password;
    if(user_login in db){
        if(user_password == db[user_login]){
            cookie_value = createSessionValue();
            response.cookie("creator", cookie_value, {httpOnly: true, sameSite: "lax"});
            posts_sessions[cookie_value] = user_login;
            response.redirect("/creator");
        }
        else{
            response.status(400).send("Incorrect password");
        }
    }
    else{
        response.status(400).send("Not such account");
    }
});

app_html.get("/api/logout", function(request, response){
    user_session = request.get("Cookie").substring(8);
    delete posts_sessions[user_session]
    response.clearCookie("creator");
    response.redirect("/login");
});

app_html.get("/creator", function(request, response){
    if(request.get("Cookie") === undefined){
        response.redirect("login");
    }
    else{
        user_session = request.get("Cookie").substring(8);
        if(user_session in posts_sessions){
            user_login = posts_sessions[user_session];
            pages_names = [];
            if(users_pages[user_login] == undefined){
                users_pages[user_login] = {};
                users_pages[user_login]["Hello page"] = "Hello, user!";
            }
            for(var name in users_pages[user_login]){
                pages_names.push(name);
            }
            response.render("page_creator", {name: user_login, pages: pages_names});
        }
        else{
            response.redirect("login");
        }
    }
});

app_html.post("/load_page", urlEncodedParser, function(request, response){
    user_session = request.get("Cookie").substring(8);
    user_login = posts_sessions[user_session];
    page_name = request.body.page_name;
    page_content = request.body.page;
    if (user_login in users_pages){
        users_pages[user_login][page_name] = page_content;
    }
    else{
        user_page = {page_name: page_content};
        users_pages[user_login] = user_page;
    }
    response.redirect("creator");
});

app_html.get("/page", function(request, response){
    page_name = decodeURI(request.query.name);
    user_session = request.get("Cookie").substring(8);
    user_login = posts_sessions[user_session];
    if(user_login == "admin"){
        user_login = request.query.check_user;
    }
    if(page_name in users_pages[user_login] || user_login == "admin"){
        response.send(users_pages[user_login][page_name]);
    }
    else{
        response.status(400).send("You don't have permissions on this page");
    }
})

app_html.listen(5001, function(){
    console.log("Listen on 5001...");
});