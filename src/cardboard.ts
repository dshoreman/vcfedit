import Contact from "./contact.js";
import MergeWindow from "./merge.js";
import * as ui from "./ui.js";
import VCard from "./vcard.js";

function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
    if (value === undefined || value === null) {
        throw new Error(`Expected value to be set, but got '${value}'.`);
    }
}

type ContactOrigin = ['after' | 'before', ChildNode] | ['solo', HTMLElement];
type DragData = {card: VCard, contact: HTMLElement, didMove: boolean, origin: ContactOrigin};

type TargettedDragEvent = DragEvent & {target: HTMLElement & {parentElement: HTMLElement}};

export default class CardBoard {
    cardBoard = ui.element('#vcards');
    cardCount = 0;
    dragging: DragData|null = null;
    template = ui.template('#vcard-column').content;
    vCards: {[key: string]: VCard} = {};

    addCardColumn(filename?: string) {
        const clone = this.template.cloneNode(true) as HTMLElement,
            id = 'vcard-' + Date.now().toString().slice(-7);

        ui.element('button.close', clone).onclick = () => this.removeCardColumn(id);
        ui.element('button.save', clone).onclick = () => this.downloadCard(id);
        ui.element('input.upload', clone).onchange = (ev) => this.loadVCardFile(ev);

        ui.element('.contacts', clone)
            .listen('dragstart', ev => this.#handleDragStart(<TargettedDragEvent> ev))
            .listen('dragend', ev => this.#handleDragEnd(<TargettedDragEvent> ev));

        ui.element('.vcard', clone)
            .listen('dragover', ev => this.#handleDragOver(<TargettedDragEvent> ev))
            .listen('drop', ev => this.#handleDrop(<TargettedDragEvent> ev))
            .id = id;

        this.cardCount += 1;
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

    #findDragOrigin(contact: HTMLElement & {parentElement: HTMLElement}): ContactOrigin {
        if (contact.previousElementSibling) {
            return ['after', contact.previousElementSibling];
        }

        if (contact.nextElementSibling) {
            return ['before', contact.nextElementSibling];
        }

        return ['solo', contact.parentElement];
    }

    #handleDragStart(event: TargettedDragEvent) {
        const contact = event.target, card = this.#nearestVCard(contact);

        this.dragging = {card, contact, didMove: false, origin: this.#findDragOrigin(contact)};

        contact.classList.add('dragging');
    }

    #handleDragEnd(event: TargettedDragEvent) {
        assertIsDefined(this.dragging);

        if (!this.dragging.didMove) {
            this.#resetContactPosition();
        }

        event.target.classList.remove('dragging');

        this.dragging = null;
    }

    #handleDragOver(event: TargettedDragEvent) {
        assertIsDefined(this.dragging);
        event.preventDefault();

        const card = this.#nearestVCard(event.target),
            [first, closest] = card.findClosestContact(event),
            draggedContact = this.dragging.contact;

        if (closest?.id === draggedContact.id) {
            return;
        }

        switch(first) {
            case 'cursor': return closest.before(draggedContact);
            case 'element': return closest.after(draggedContact);
            default:
                return ui.element('.contacts', card.column).append(draggedContact);
        }
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

        newCard.addContact(contact);
        oldCard.removeContact(contact);
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

        card.tearDown();
        delete this.vCards[vCardID];
    }

    #resetContactPosition() {
        if (!this.dragging) {
            throw new Error("Nothing to reset!");
        }

        const {contact} = this.dragging,
            [position, origin] = this.dragging.origin;

        if (position === 'solo') {
            return origin.append(contact);
        }

        origin[position](contact);
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
