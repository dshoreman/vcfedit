import CardBoard from "./cardboard.js";
import * as ui from "./ui.js";

const board = new CardBoard();

ui.element('#extracard').onclick = () => {
    const id = board.addCardColumn();

    ui.element(`#${id} input`).click();
};

ui.element('#new-file-form').onsubmit = (ev) => {
    const input = ui.element(
        'input[type=text]',
        ev.target as HTMLElement,
    ) as any as HTMLInputElement;

    let filename = input.value;
    if (!filename.endsWith('.vcf')) {
        filename += '.vcf';
    }

    ev.preventDefault();
    board.addCardColumn(filename);
    ui.element('#new-file').hidePopover();
};
