import CardBoard from "./cardboard.js";
import * as ui from "./ui.js";

const board = new CardBoard();

ui.element('#extracard').onclick = () => {
    const id = board.addCardColumn();

    ui.element(`#${id} input`).click();
};

ui.element('#new-file-form').onsubmit = (ev) => {
    const input = <HTMLInputElement & {parentNode: HTMLElement}>
        ui.element('input[type=text]', (<HTMLElement>ev.target));
    let filename = input.value;

    if (!filename.endsWith('.vcf')) {
        filename += '.vcf';
    }

    ev.preventDefault();
    board.addCardColumn(filename);
    ui.element('#new-file').hidePopover();
};
