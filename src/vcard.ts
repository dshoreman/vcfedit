import Contact from "./contact.js";
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
            const contact = new Contact(vCard[0]);

            ui.element('.contacts', this.column).append(contact.vCard());
        }
    }

    #forFile(filename: string): void {
        this.filename = filename;

        this.#setHeader();
    }

    #setHeader() {
        ui.element('h2', this.column).innerText = this.filename || 'Loading...';
    }
}
