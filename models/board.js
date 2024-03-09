const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boardSchema = new Schema({
    title: String,
    contents: String,
    name: String,
    board_date: { type: Date, default: Date.now() }
});

const Board = mongoose.model("Board", boardSchema);

module.exports = { Board }; 