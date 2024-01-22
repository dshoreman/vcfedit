import CardBoard from "./cardboard.js";
import * as ui from "./ui.js";

const board = new CardBoard();

ui.element('#extracard').onclick = () => {
    const id = board.addCardColumn();

    ui.element(`#${id} input`).click();
};

ui.element('#new-file-form').onsubmit = (ev) => {
    const filename = ui.element('input[type=text]', ev.target).value;

    ev.preventDefault();
    board.addCardColumn(filename);
    ev.target.parentElement.hidePopover();
};
