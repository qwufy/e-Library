const mongoose=require("mongoose")


mongoose.connect("mongodb+srv://sayat:sayat2005@cluster0.2zm9xd9.mongodb.net/")
.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const logInSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    surname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    dob:{
        type:Date,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    emailToken: String,
    isVerified: {
        type: Boolean,
        default: false
    }
})

const LogInCollection=new mongoose.model('LogInCollection',logInSchema)

const bookSchema = new mongoose.Schema({
    cover:  String,
    bookId: { type: String, unique: true },
    title: String,
    author: String,
    description: String
});

const BookCollection = mongoose.model('BookCollection', bookSchema);


module.exports = { LogInCollection, BookCollection };
