import Contact from "./contact.js";
import MergeWindow from "./merge.js";
import * as ui from "./ui.js";
import VCard from "./vcard.js";

export default class CardBoard {
    cardBoard = ui.element('#vcards');
    cardCount = 0;
    dragging: HTMLElement|null = null;
    lastHovered: HTMLElement|null = null;
    template = ui.template('#vcard-column').content;
    vCards: {[key: string]: VCard} = {};

    addCardColumn(filename?: string) {
        const clone = this.template.cloneNode(true) as HTMLElement,
            id = 'vcard-' + Date.now().toString().slice(-7);

        this.cardCount += 1;
        ui.element('button.close', clone).onclick = this.removeCardColumn;
        ui.element('button.save', clone).onclick = () => this.downloadCard(id);
        ui.element('input.upload', clone).onchange = (ev) => this.loadVCardFile(ev);
        ui.element('.contacts', clone).addEventListener('dragstart', ev => this.#handleDragStart(ev));
        ui.element('.contacts', clone).addEventListener('dragend', ev => this.#handleDragEnd(ev));
        ui.element('.vcard', clone).addEventListener('dragover', ev => this.#handleDragOver(ev), false);
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

        this.#resetHover();
        this.dragging = null;
    }

    #handleDragOver(event: DragEvent) {
        const hovering = document.elementFromPoint(event.clientX, event.clientY),
            contact = <HTMLElement|null>hovering?.closest('.contact');

        event.preventDefault();

        if (contact) {
            this.#resetHover();
            this.lastHovered = contact;
        }
        if (!contact || !this.dragging || [
            contact.id,
            contact.previousElementSibling?.id,
        ].includes(this.dragging.id)) {
            return;
        }

        contact.classList.add('hovering');
        contact.style.marginTop = `calc(${this.dragging.offsetHeight}px + 2vh)`;
    }

    #handleDrop(event: DragEvent) {
        const sourceNode = <HTMLElement>this.dragging,
            sourceVCard = this.#nearestVCard(sourceNode),
            targetVCard = this.#nearestVCard(event.target as HTMLElement),
            contactBelow = document.elementFromPoint(event.clientX, event.clientY)?.closest('.contact'),
            nextContact = document.elementFromPoint(
                event.clientX,
                event.clientY + sourceNode.offsetHeight
            )?.closest('.contact');

        if (contactBelow && contactBelow.id !== sourceNode.id) {
            this.#mergeContacts(sourceVCard, targetVCard, contactBelow)
        } else if (nextContact?.id !== sourceNode.id) {
            this.#moveContact(sourceVCard, targetVCard, nextContact);
        }

        sourceNode.classList.remove('dragging');
    }

    #mergeContacts(oldCard: VCard, newCard: VCard, mergeInto: Element) {
        const merge = new MergeWindow(
            <Contact>oldCard.contacts[(<HTMLElement>this.dragging).id],
            <Contact>newCard.contacts[mergeInto.id],
        );

        merge.show();
    }

    #moveContact(oldCard: VCard, newCard: VCard, beforeContact?: Element|null) {
        const contactCard = <HTMLElement>this.dragging,
            contacts = ui.element('.contacts', newCard.column);

        newCard.contacts[contactCard.id] = <Contact>oldCard.contacts[contactCard.id],

        ui.element('.contacts', oldCard.column).removeChild(contactCard);
        if (beforeContact) {
            contacts.insertBefore(contactCard, beforeContact);
        } else {
            contacts.prepend(contactCard);
        }

        delete oldCard.contacts[contactCard.id];
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

    #resetHover() {
        const wasHovering = <HTMLElement|null>document.querySelector('.hovering');

        if (wasHovering) {
            wasHovering.style.marginTop = '1vh';
            wasHovering.classList.remove('hovering');
        }
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
