const mongoose = require('mongoose');

const connectDB = async ()=>{
    try{
        const con = await mongoose.connect(process.env.MONGO_URI)
        console.log("Database Connected");
    }
    catch(error){
        console.log("Database Connection Failed", error);
        process.exit(1);    
    }
}

module.exports = connectDB;