const express = require("express")
const path = require("path")
const axios = require("axios");
const app = express()
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const LogInCollection = require("./mongo")
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }))
const tempelatePath = path.join(__dirname, '../tempelates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', tempelatePath)
app.use(express.static(publicPath))


app.get('/signup', (req, res) => {
    res.render('signup')
})
app.get('/', (req, res) => {
    res.render('login')
})
app.get('/profile', (req, res) => {
    res.render('profile');
});
app.get('/home', async (req, res) => {
    try {
        // Здесь делаем запрос к Google Books API
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: 'programming', // Замените на ваш запрос
                key: 'AIzaSyCGAbTdLgR_N0EF95SOYpbJh8w5_AQpEf0', // Замените на свой API-ключ
            },
        });

        // Получаем массив книг из ответа
        const books = response.data.items;

        // Рендерим страницу "home" и передаем массив книг в шаблон
        res.render('home', { books });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/book/:id', (req, res) => {
    // Здесь вы можете добавить логику для получения информации о конкретной книге
    // с использованием id из параметра запроса и передать ее при рендеринге страницы
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
            user: 'moldrakhmetov05@gmail.com',
            pass: 'az.az.sayat05',
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
        emailVerified: false,  // Устанавливаем в false, так как email еще не подтвержден
    };

    try {
        const checking = await LogInCollection.findOne({ email: req.body.email });

        if (checking) {
            res.send("User with this email already exists");
        } else {
            await LogInCollection.create(data);

            // Отправка электронной почты с токеном подтверждения
            sendEmailVerificationEmail(req.body.email, data.emailVerificationToken);

            res.status(201).render("home", {
                naming: req.body.name
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/login', async (req, res) => {
    try {
        const check = await LogInCollection.findOne({ name: req.body.name });

        if (check.password === req.body.password) {
            res.status(201).render("home", { naming: req.body.name });
        } else {
            res.send("Incorrect Password");
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

app.listen(port, () => {
    console.log('port connected');
})