import CardBoard from "./cardboard.js";

const board = new CardBoard();

document.getElementById('extracard').onclick = () =>
    board.addCardColumn();
