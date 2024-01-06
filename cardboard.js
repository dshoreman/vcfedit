import VCard from "./vcard.js";

export default class CardBoard {
    template = document.querySelector('#vcard-column').content;
    cardBoard = document.querySelector('#vcards');
    cardCount = 0;

    addCardColumn() {
        const clone = this.template.cloneNode(true);

        clone.querySelector('input').onchange = this.loadVCardFile;

        this.cardCount += 1;
        this.cardBoard.style.columnCount = this.cardCount;
        this.cardBoard.append(clone);
    }

    loadVCardFile(event) {
        const file = event.target.files[0],
            reader = new FileReader(),
            vCard = new VCard(file.name, event.target.parentNode);

        reader.onload = () => vCard.process(reader.result);

        reader.readAsText(file);
    }
};
