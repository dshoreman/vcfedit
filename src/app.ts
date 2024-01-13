import CardBoard from "./cardboard.js";
import * as ui from "./ui.js";

const board = new CardBoard();

ui.element('#extracard').onclick = () => board.addCardColumn();
