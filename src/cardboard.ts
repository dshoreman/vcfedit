import * as ui from "./ui.js";
import VCard from "./vcard.js";

export default class CardBoard {
    template = ui.template('#vcard-column').content;
    cardBoard = ui.element('#vcards');
    cardCount = 0;
    vCards: {[key: string]: VCard} = {};

    addCardColumn() {
        const clone = this.template.cloneNode(true) as HTMLElement,
            id = 'vcard-' + Date.now().toString().slice(-7);

        this.cardCount += 1;
        ui.element('button.close', clone).onclick = this.removeCardColumn;
        ui.element('button.save', clone).onclick = () => this.downloadCard(id);
        ui.element('input.upload', clone).onchange = (ev) => this.loadVCardFile(ev);
        ui.element('.vcard', clone).id = id;

        this.cardBoard.style.columnCount = this.cardCount.toString();
        this.cardBoard.append(clone);

        this.vCards[id] = new VCard(id);
        ui.element(`#${id} input`).click();
    }

    downloadCard(cardID: string) {
        const card = this.vCards[cardID];

        if (!card) {
            throw new Error("Card '${cardID}' no longer exists.");
        }

        card.download();
    }

    removeCardColumn(event: Event) {
        const parent = (<HTMLElement>(<HTMLElement>event.target).parentNode)

        parent.outerHTML = '';
    }

    loadVCardFile(event: Event) {
        const el = event.target as HTMLElement & {files: FileList},
            file = <File>el.files[0],
            reader = new FileReader(),
            vCard = <VCard>this.vCards[(<HTMLElement>el.parentElement).id];

        reader.onload = () => vCard.process(file.name, reader.result as string);

        reader.readAsText(file);
    }
};
