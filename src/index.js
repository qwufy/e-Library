const express = require("express");
const cool = require('cool-ascii-faces');
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const app = express();
const nodemailer = require('nodemailer');
require('dotenv').config();
const LogInCollection = require("./mongo");
const port = process.env.PORT || 3000;
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const srcPath = path.join(__dirname, '../src'); // Путь к папке src
app.use(express.static(srcPath)); // Обработка папки src

app.use(express.urlencoded({ extended: false }));
const tempelatePath = path.join(__dirname, '../tempelates');
const publicPath = path.join(__dirname, '../public');
console.log(publicPath);

app.set('view engine', 'hbs');
app.set('views', tempelatePath);
app.use(express.static(publicPath));

app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/', (req, res) => {
    res.render('login');
});
app.get('/profile', (req, res) => {
    res.render('profile');
});
app.get('/home', async (req, res) => {
    try {
        const searchTerm = req.query.search; // Получаем поисковый запрос из параметра запроса
        // Здесь делаем запрос к Google Books API
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: searchTerm || 'money', // Замените на ваш запрос
                key: 'AIzaSyCGAbTdLgR_N0EF95SOYpbJh8w5_AQpEf0',
                maxResults: 20,
            },
        });

        // Получаем массив книг из ответа
        const books = response.data.items;

        // Рендерим страницу "home" и передаем массив книг в шаблон
        res.render('home', { books });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');

        if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Request error:', error.request);
        } else {
            console.error('Error message:', error.message);
        }

        alert('Failed to fetch search results. Please try again.');
    }
});
app.get('/book/:id', (req, res) => {
    const bookId = req.params.id;
    const bookInfo = {
        _id: bookId,
        cover: `book${bookId}.jpg`,
        title: `Book ${bookId}`,
        author: `Author ${bookId}`,
        description: `Description for Book ${bookId}`,
    };

    res.render('book', { book: bookInfo });
});

function generateEmailVerificationToken() {
    return crypto.randomBytes(16).toString('hex');
}

function sendEmailVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        // Настройте здесь свой почтовый сервер
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: 'moldrakhmetov05@gmail.com',
        to: email,
        subject: 'Email Verification',
        text: `Click on the following link to verify your email: http://your-app-url/verify/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        dob: req.body.dob,
        password: req.body.password,
        emailVerificationToken: generateEmailVerificationToken(),
        emailVerified: false,
    };

    try {
        const checking = await LogInCollection.findOne({ email: req.body.email });

        if (checking) {
            res.send("User with this email already exists");
        } else {
            await LogInCollection.create(data);
            sendEmailVerificationEmail(req.body.email, data.emailVerificationToken);

            // После успешной регистрации, перенаправляем пользователя на страницу home
            res.redirect("/home");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/login', async (req, res) => {
    try {
        const check = await LogInCollection.findOne({ name: req.body.name });

        if (check && check.password === req.body.password) {
            // После успешного входа, перенаправляем пользователя на страницу home
            res.redirect("/home");
        } else {
            res.send("Incorrect Password or User not found");
        }
    } catch (e) {
        res.send("Wrong Details");
    }
});

app.get('/verify/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const user = await LogInCollection.findOne({ emailVerificationToken: token });

        if (user) {
            // Устанавливаем флаг emailVerified в true
            await LogInCollection.updateOne({ _id: user._id }, { $set: { emailVerified: true } });

            res.send('Email verified successfully. You can now log in.');
        } else {
            res.send('Invalid token.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/cool', (req, res) => res.send(cool()));

app.listen(port, () => {
    console.log('port connected');
});
