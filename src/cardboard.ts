import Contact from "./contact.js";
import MergeWindow from "./merge.js";
import * as ui from "./ui.js";
import VCard from "./vcard.js";

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
    if (value === undefined || value === null) {
        throw new Error(`Expected value to be set, but got '${value}'.`);
    }
}

type DragData = {card: VCard, contact: HTMLElement, didMove: boolean, origin: ChildNode|null};

export default class CardBoard {
    cardBoard = ui.element('#vcards');
    cardCount = 0;
    dragging: DragData|null = null;
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
        const contact = <HTMLElement>event.target,
            origin = contact.nextElementSibling || contact.previousElementSibling || null;

        this.dragging = {card: this.#nearestVCard(contact), contact, didMove: false, origin};

        contact.classList.add('dragging');
    }

    #handleDragEnd(event: DragEvent) {
        if (this.dragging?.origin && !this.dragging.didMove) {
            this.dragging.origin.before(this.dragging.contact);
        }

        (<HTMLElement>event.target).classList.remove('dragging');

        this.dragging = null;
    }

    #handleDragEnter(event: DragEvent) {
        assertIsDefined(this.dragging);

        const d = this.dragging.contact,
            t: HTMLElement|null = (<HTMLElement>event.target).closest('.contact'),
            card = this.#nearestVCard(event.target as HTMLElement);

        if (card && !t && card !== this.dragging.card) {
            ui.element('.contacts', card.column).append(d);
        }
        if (!t || t.offsetTop === d.offsetTop) {
            return;
        }

        t.offsetTop > d.offsetTop ? t.before(d) : t.after(d);
    }

    #handleDrop(event: DragEvent) {
        assertIsDefined(this.dragging);

        const target: HTMLElement = <HTMLElement>event.target,
            [oldCard, newCard] = [this.dragging.card, this.#nearestVCard(target)],
            contact = target.closest('.contact');

        if (!contact || contact === this.dragging.contact) {
            return this.#moveContact(oldCard, newCard);
        }

        this.#mergeContacts(oldCard, newCard, contact);
    }

    #mergeContacts(oldCard: VCard, newCard: VCard, mergeInto: Element) {
        assertIsDefined(this.dragging);

        const merge = new MergeWindow(
            oldCard, <Contact>oldCard.contacts[(this.dragging.contact).id],
            newCard, <Contact>newCard.contacts[mergeInto.id],
        );

        merge.show();
    }

    #moveContact(oldCard: VCard, newCard: VCard) {
        assertIsDefined(this.dragging);
        this.dragging.didMove = true;

        const contact = oldCard.contacts[this.dragging.contact.id];

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
