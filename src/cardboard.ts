import VCard from "./vcard.js";

export default class CardBoard {
    template = document.querySelector<HTMLTemplateElement>('#vcard-column').content;
    cardBoard = document.querySelector<HTMLElement>('#vcards');
    cardCount = 0;

    addCardColumn() {
        const clone = this.template.cloneNode(true) as HTMLElement;

        this.cardCount += 1;

        clone.querySelector<HTMLInputElement>('button.close').onclick = this.removeCardColumn;
        clone.querySelector<HTMLInputElement>('input.upload').onchange = this.loadVCardFile;
        clone.querySelector<HTMLDivElement>('.vcard').id = `vcard-${this.cardCount}`;

        this.cardBoard.style.columnCount = this.cardCount.toString();
        this.cardBoard.append(clone);

        document.querySelector<HTMLInputElement>(`#vcard-${this.cardCount} input`).click();
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
