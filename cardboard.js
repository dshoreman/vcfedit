import VCard from "./vcard.js";

export default class CardBoard {
    template = document.querySelector('#vcard-column').content;
    cardBoard = document.querySelector('#vcards');
    cardCount = 0;

    addCardColumn() {
        const clone = this.template.cloneNode(true);

        this.cardCount += 1;

        clone.querySelector('input').onchange = this.loadVCardFile;
        clone.querySelector('.vcard').id = `vcard-${this.cardCount}`;

        this.cardBoard.style.columnCount = this.cardCount;
        this.cardBoard.append(clone);

        document.querySelector(`#vcard-${this.cardCount} input`).click();
    }

    loadVCardFile(event) {
        const file = event.target.files[0],
            reader = new FileReader(),
            vCard = new VCard(file.name, event.target.parentNode);

        reader.onload = () => vCard.process(reader.result);

        reader.readAsText(file);
    }
};