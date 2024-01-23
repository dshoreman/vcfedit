import Contact from "./contact.js";
import {VCardProperty} from "./vcards/properties.js";
import * as ui from "./ui.js"

export default class VCard {
    #cardRegex = /BEGIN:VCARD([\w\W]*?)END:VCARD/g;
    contacts: {[key: string]: Contact} = {};
    column: HTMLDivElement;
    id: string;
    filename: string | undefined;

    constructor(id: string, filename?: string) {
        this.id = id;
        this.column = <HTMLDivElement>ui.element(`#${id}`);

        this.#setHeader(filename);
    }

    process(filename: string, vcfData: string) {
        this.#setHeader(filename);

        for (const vCard of vcfData.matchAll(this.#cardRegex)) {
            const contact = this.#contactFromVCard(vCard[0]),
                contactCard = contact.vCard();

            ui.element('.save', contactCard).onclick = () => contact.download();

            ui.element('.contacts', this.column).append(contactCard);
            this.contacts[contact.id] = contact;
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

    // Split continuous lines on CRLF followed by space or tab.
    // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
    #unfoldLines(foldedLines: string): string[] {
        return foldedLines
            .replace(/\r\n[\t\u0020]/g, '')
            .split('\r\n')
            .filter(v => v);
    }
}
