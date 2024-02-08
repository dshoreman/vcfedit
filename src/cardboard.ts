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

type TargettedDragEvent = DragEvent & {target: HTMLElement};

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
        ui.element('.contacts', clone).addEventListener('dragstart', e => this.#handleDragStart(<TargettedDragEvent>e));
        ui.element('.contacts', clone).addEventListener('dragend', e => this.#handleDragEnd(<TargettedDragEvent>e));
        ui.element('.vcard', clone).addEventListener('dragover', e => this.#handleDragOver(<TargettedDragEvent>e));
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

    #handleDragStart(event: TargettedDragEvent) {
        const contact = event.target,
            origin = contact.nextElementSibling || contact.previousElementSibling;

        this.dragging = {card: this.#nearestVCard(contact), contact, didMove: false, origin};

        contact.classList.add('dragging');
    }

    #handleDragEnd(event: TargettedDragEvent) {
        if (this.dragging?.origin && !this.dragging.didMove) {
            this.dragging.origin.before(this.dragging.contact);
        }

        event.target.classList.remove('dragging');

        this.dragging = null;
    }

    #handleDragOver(event: TargettedDragEvent) {
        event.preventDefault();
        assertIsDefined(this.dragging);

        const card = <HTMLElement>event.target.closest('.vcard'),
            contact: HTMLElement | null =
                event.target.closest('.contact') || ui.closest('.contact', event, card),
            dragging = this.dragging.contact;

        if (!contact) {
            return ui.element('.contacts', card).append(dragging);
        }

        if (contact.id === dragging.id) {
            return;
        }

        const contactRect = contact.getBoundingClientRect(),
            contactCenterY = contactRect.top + contactRect.height / 2,
            draggedContact = this.dragging.contact;

        if (event.y < contactCenterY) {
            return contact.before(draggedContact);
        }

        contact.after(draggedContact);
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
        if (element && !element.classList.contains('vcard')) {
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
