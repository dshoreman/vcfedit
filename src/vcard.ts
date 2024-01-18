import Contact from "./contact.js";
import {VCardProperty} from "./vcards/properties.js";
import * as ui from "./ui.js"

export default class VCard {
    #cardRegex = /BEGIN:VCARD([\w\W]*?)END:VCARD/g;
    column: HTMLDivElement;
    id: string;
    filename: string | undefined;

    constructor(id: string) {
        this.id = id;
        this.column = <HTMLDivElement>ui.element(`#${id}`);

        this.#setHeader();
    }

    process(filename: string, vcfData: string) {
        this.#forFile(filename);

        for (const vCard of vcfData.matchAll(this.#cardRegex)) {
            const contact = this.#contactFromVCard(vCard[0]);

            ui.element('.contacts', this.column).append(contact.vCard());
        }
    }

    #contactFromVCard(vCard: string): Contact {
        const properties = [];

        for (const line of this.#unfoldLines(vCard)) {
            try {
                properties.push(new VCardProperty(line));
            } catch (e) {
                console.warn(`Oops! ${e}`);
            }
        }

        return new Contact(vCard, properties);
    }

    #forFile(filename: string): void {
        this.filename = filename;

        this.#setHeader();
    }

    #setHeader() {
        ui.element('h2', this.column).innerText = this.filename || 'Loading...';
    }

    // Split continuous lines on CRLF followed by space or tab.
    // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
    #unfoldLines(vCard: string): string[] {
        const unfolded = vCard.replace(/\r\n[\t\u0020]/g, '');

        return unfolded.split('\r\n').map(v => v);
    }
}
