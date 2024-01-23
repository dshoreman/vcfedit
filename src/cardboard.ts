import Contact from "./contact.js";
import * as ui from "./ui.js";
import VCard from "./vcard.js";

export default class CardBoard {
    dragging: HTMLElement|null = null;
    template = ui.template('#vcard-column').content;
    cardBoard = ui.element('#vcards');
    cardCount = 0;
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

        document.querySelector('.hovering')?.classList.remove('hovering');
        this.dragging = null;
    }

    #handleDragOver(event: DragEvent) {
        const hovering = document.elementFromPoint(event.clientX, event.clientY),
            contact = hovering?.closest('.contact') as HTMLElement;

        event.preventDefault();

        if (contact) {
            document.querySelector('.hovering')?.classList.remove('hovering');
            contact.classList.add('hovering');
        }
    }

    #handleDrop(event: DragEvent) {
        const sourceNode = <HTMLElement>this.dragging,
            sourceVCard = this.#nearestVCard(sourceNode),
            targetVCard = this.#nearestVCard(event.target as HTMLElement),
            beforeContact = document.elementFromPoint(event.clientX, event.clientY)?.closest('.contact');

        this.#moveContact(sourceVCard, targetVCard, beforeContact);

        sourceNode.classList.remove('dragging');
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
