const express = require("express");
const bcrypt = require('bcrypt');
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const app = express();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { LogInCollection, BookCollection } = require('./mongo');
const port = process.env.PORT || 3000;
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'images')));


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
app.get('/book', (req, res) =>{
    res.render('book')
})

async function getRecommendedBooks() {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: 'recommended books',
                maxResults: 5,
            },
        });

        return response.data.items;
    } catch (error) {
        console.error('Failed to fetch recommended books:', error);
        return [];
    }
}

async function getFeaturedAuthors() {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: 'featured authors',
                maxResults: 5,
            },
        });

        return response.data.items;
    } catch (error) {
        console.error('Failed to fetch featured authors:', error);
        return [];
    }
}

app.get('/home', async (req, res) => {
    try {
        const searchTerm = req.query.search; // Получаем поисковый запрос из параметра запроса
        // Здесь делаем запрос к Google Books API для книг на основе поискового запроса
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: searchTerm || 'programming, time, success', // Замените на ваш запрос
                maxResults: 5,
            },
        });

        // Получаем массив книг из ответа
        const books = response.data.items;

        // Получаем рекомендованные книги и выдающихся авторов
        const recommendedBooks = await getRecommendedBooks();
        const featuredAuthors = await getFeaturedAuthors();

        // Рендерим страницу "home" и передаем массив книг, рекомендованные книги и выдающихся авторов в шаблон
        res.render('home', { books, recommendedBooks, featuredAuthors });
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

app.get("/library", async (req, res) => {
    try {
        // Загружаем все книги из базы данных
        const books = await BookCollection.find({});
        // Отображаем страницу библиотеки и передаем загруженные книги
        res.render("library", { books });
    } catch (error) {
        console.error("Error loading books:", error);
        res.status(500).send("Failed to load books");
    }
});

app.delete('/delete-book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        await BookCollection.findByIdAndDelete(bookId);
        res.status(200).send('Book deleted successfully');
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).send('Internal Server Error');
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

function generateJwtToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30m' });
}


async function hashPassword(password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Hashed password:', hashedPassword); 
        return hashedPassword;
    } catch (error) {
        throw new Error("Failed to hash password");
    }
}



app.post('/signup', async (req, res) => {
    const { name, surname, email, dob, password } = req.body;

    try {
        const existingUser = await LogInCollection.findOne({ email });

        if (existingUser) {
            return res.send("A user with this email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new LogInCollection({
            name,
            surname,
            email,
            dob,
            password: hashedPassword,
        });

        await newUser.save();

        const token = generateJwtToken(newUser._id);

        // Отправляем перенаправление на страницу home с токеном в качестве параметра запроса
        res.redirect(`/home?token=${token}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


  
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await LogInCollection.findOne({ email });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const token = generateJwtToken(user._id);
                res.redirect(`/home?token=${token}`);
            } else {
                res.status(401).send("Invalid credentials");
            }
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/save-book', async (req, res) => {
    try {
        const { userId, bookId, title, author, description } = req.body;

        // Создаем новую книгу
        const book = new BookCollection({
            bookId: bookId,
            title: title,
            author: author,
            description: description
        });

        // Сохраняем книгу в базу данных
        await book.save();

        res.status(200).send('Book saved successfully');
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log('port connected');
});
