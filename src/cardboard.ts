import * as ui from "./ui.js";
import VCard from "./vcard.js";

export default class CardBoard {
    template = ui.template('#vcard-column').content;
    cardBoard = ui.element('#vcards');
    cardCount = 0;

    addCardColumn() {
        const clone = this.template.cloneNode(true) as HTMLElement;

        this.cardCount += 1;

        ui.element('button.close', clone).onclick = this.removeCardColumn;
        ui.element('input.upload', clone).onchange = this.loadVCardFile;
        ui.element('.vcard', clone).id = `vcard-${this.cardCount}`;

        this.cardBoard.style.columnCount = this.cardCount.toString();
        this.cardBoard.append(clone);

        ui.element(`#vcard-${this.cardCount} input`).click();
    }

    removeCardColumn(event) {
        event.target.parentNode.outerHTML = '';
    }

    loadVCardFile(event) {
        const file = event.target.files[0],
            reader = new FileReader(),
            vCard = new VCard(file.name, event.target.parentNode);

        reader.onload = () => vCard.process(reader.result);

        reader.readAsText(file);
    }
};
