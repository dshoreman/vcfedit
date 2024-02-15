import Contact from "./contact.js";
import {Property, VCardProperty} from "./vcards/properties.js";
import * as ui from "./ui.js"

export default class VCard {
    #cardRegex = /BEGIN:VCARD([\w\W]*?)END:VCARD/g;
    contacts: {[key: string]: Contact} = {};
    column: HTMLDivElement;
    id: string;
    filename: string | undefined;
    #observer: IntersectionObserver;
    #visibleContacts: object & {[id: string]: HTMLElement} = {};

    constructor(id: string, filename?: string) {
        this.id = id;
        this.column = ui.element(`#${id}`) as any as HTMLDivElement;
        this.#observer = new IntersectionObserver(entries => this.#changeContactVisibility(entries), {
            root: ui.element('.contacts', this.column),
        });

        this.#setHeader(filename);
    }

    addContact(contact: Contact) {
        this.contacts[contact.id] = contact;
        this.#observer.observe(ui.element(`#${contact.id}`));
    }

    process(filename: string, vcfData: string) {
        this.#setHeader(filename);

        for (const vCard of vcfData.matchAll(this.#cardRegex)) {
            const contact = this.#contactFromVCard(vCard[0]),
                contactCard = contact.vCard();

            ui.element('.contact-header', contactCard).onclick = (e) => this.#toggleContactDetails(e);
            ui.element('.save', contactCard).onclick = (e) => contact.download(e);
            ui.element('.remove', contactCard).onclick = (e) => this.#removeContactItem(contact, e);

            ui.element('.contacts', this.column).append(contactCard);
            this.addContact(contact);
        }
    }

    #changeContactVisibility(entries: IntersectionObserverEntry[]) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                this.#visibleContacts[entry.target.id] = entry.target as HTMLElement;
            } else if (entry.target.id in this.#visibleContacts) {
                delete this.#visibleContacts[entry.target.id];
            }
        }
    }

    download() {
        const a = document.createElement('a'),
            data = this.export() + '\r\n';

        a.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
        a.setAttribute('download', `${this.filename}`);
        a.style.display = 'none';

        document.body.appendChild(a).click();
        document.body.removeChild(a);
    }

    export() {
        const cards: string[] = [];

        Object.values(this.contacts).forEach(c => cards.push(c.export()));

        return cards.join('\r\n');
    }

    findClosestContact(event: MouseEvent & {target: HTMLElement}) {
        return ui.closest('.contact', event, Object.values(this.#visibleContacts))
    }

    formatPhoneNumbers() {
        for (const contact of Object.values(this.contacts)) {
            if (!contact.hasProperty(Property.phone))
                continue;

            for (const prop of contact.properties) {
                if (Property.phone !== prop.name)
                    continue;

                prop.value.formatted = prop.value.formatted.replace(/[^+#*\d]/g, '')
            }

            this.refreshContact(contact);
        }
    }

    refreshContact(contact: Contact) {
        this.contacts[contact.id] = contact;

        ui.element(`#${contact.id}`, this.column).replaceWith(contact.vCard());
    }

    removeContact(contact: Contact) {
        this.#observer.unobserve(ui.element(`#${contact.id}`));

        delete this.contacts[contact.id];
    }
    #removeContactItem(contact: Contact, event: Event) {
        event.stopPropagation();

        ui.element(`#${contact.id}`, this.column).remove();

        this.removeContact(contact);
    }

    #toggleContactDetails(event: Event) {
        const contactCard = (<HTMLElement>event.target).closest('.contact') as HTMLElement,
            icon = ui.element('i', contactCard);

        ui.element('ul', contactCard).classList.toggle('hidden');

        icon.innerText = `expand_${'expand_more' === icon.innerText ? 'less' : 'more'}`;
    }

    #contactFromVCard(vCard: string): Contact {
        const properties = [],
            unfoldedLines = this.#unfoldLines(vCard);

        for (const unfoldedLine of unfoldedLines) {
            try {
                properties.push(new VCardProperty(vCard, unfoldedLine));
            } catch (e) {
                console.warn(`Oops! ${e}`);
            }
        }

        return new Contact(vCard, properties);
    }

    #setHeader(filename?: string) {
        if (filename) {
            this.filename = filename;
        }

        ui.element('h2', this.column).innerText = this.filename || 'Loading...';
    }

    tearDown() {
        this.#observer.disconnect();
        this.column.remove();
    }

    // Split continuous lines on CRLF followed by space or tab.
    // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
    #unfoldLines(foldedLines: string): string[] {
        return foldedLines
            .replace(/\r\n[\t\u0020]/g, '')
            .split('\r\n')
            .filter(v => v);
    }
}
