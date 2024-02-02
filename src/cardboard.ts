import Contact from "./contact.js";
import MergeWindow from "./merge.js";
import * as ui from "./ui.js";
import VCard from "./vcard.js";

export default class CardBoard {
    cardBoard = ui.element('#vcards');
    cardCount = 0;
    dragging: HTMLElement|null = null;
    template = ui.template('#vcard-column').content;
    vCards: {[key: string]: VCard} = {};

    addCardColumn(filename?: string) {
        const clone = this.template.cloneNode(true) as HTMLElement,
            id = 'vcard-' + Date.now().toString().slice(-7);

        this.cardCount += 1;
        ui.element('button.close', clone).onclick = () => this.removeCardColumn(id);
        ui.element('button.save', clone).onclick = () => this.downloadCard(id);
        ui.element('input.upload', clone).onchange = (ev) => this.loadVCardFile(ev);
        ui.element('.contacts', clone).addEventListener('dragstart', ev => this.#handleDragStart(ev));
        ui.element('.contacts', clone).addEventListener('dragend', ev => this.#handleDragEnd(ev));
        ui.element('.vcard', clone).addEventListener('dragenter', ev => this.#handleDragEnter(ev));
        ui.element('.vcard', clone).addEventListener('dragover', ev => ev.preventDefault(), false);
        ui.element('.vcard', clone).addEventListener('drop', ev => this.#handleDrop(ev));
        ui.element('.vcard', clone).id = id;

        this.cardBoard.style.columnCount = this.cardCount.toString();
        this.cardBoard.append(clone);

        this.vCards[id] = new VCard(id, filename);

        return id;
    }

    downloadCard(cardID: string) {
        const card = this.vCards[cardID];

        if (!card) {
            throw new Error("Card '${cardID}' no longer exists.");
        }

        card.download();
    }

    #handleDragStart(event: DragEvent) {
        const target = <HTMLElement>event.target;

        this.dragging = target;

        target.classList.add('dragging');
    }

    #handleDragEnd(event: DragEvent) {
        (<HTMLElement>event.target).classList.remove('dragging');

        this.dragging = null;
    }

    #handleDragEnter(event: DragEvent) {
        const d = <HTMLElement>this.dragging,
            t: HTMLElement|null = (<HTMLElement>event.target).closest('.contact');

        if (!t || t.offsetTop === d.offsetTop) {
            return;
        }

        t.offsetTop > d.offsetTop ? t.before(d) : t.after(d);
    }

    #handleDrop(event: DragEvent) {
        const t: HTMLElement|null = (<HTMLElement>event.target).closest('.contact'),
            [newCard, oldCard] = [this.#nearestVCard(t), this.#nearestVCard(this.dragging)];

        if (t && t === this.dragging) {
            this.#moveContact(oldCard, newCard);
        } else if (t) {
            this.#mergeContacts(oldCard, newCard, t);
        }

        this.dragging?.classList.remove('dragging');
    }

    #mergeContacts(oldCard: VCard, newCard: VCard, mergeInto: Element) {
        const merge = new MergeWindow(
            oldCard, <Contact>oldCard.contacts[(<HTMLElement>this.dragging).id],
            newCard, <Contact>newCard.contacts[mergeInto.id],
        );

        merge.show();
    }

    #moveContact(oldCard: VCard, newCard: VCard) {
        const contact = oldCard.contacts[(<HTMLElement>this.dragging).id];

        if (!contact || oldCard.id === newCard.id) {
            return;
        }

        newCard.contacts[contact.id] = contact;

        delete oldCard.contacts[contact.id];
    }

    #nearestVCard(element: HTMLElement|null): VCard {
        if (element && !element?.classList.contains('vcard')) {
            element = element.closest('.vcard');
        }

        if (!element) {
            throw new Error("Couldn't identify correct vCard column to drop in.");
        }

        return <VCard>this.vCards[element.id];
    }

    removeCardColumn(vCardID: string) {
        const card = this.vCards[vCardID];

        if (!card) {
            throw new Error(`Card '${vCardID}' not found.`);
        }

        card.column.remove();

        delete this.vCards[vCardID];
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
