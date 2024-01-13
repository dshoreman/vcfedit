import Contact from "./contact.js";
import * as ui from "./ui.js"

export default class VCard {
    #cardRegex = /BEGIN:VCARD([\w\W]*?)END:VCARD/g;
    column: HTMLDivElement;
    filename: string;

    constructor(filename, parentColumn) {
        this.filename = filename;
        this.column = parentColumn;
    }

    process(vcfData) {
        ui.element('h2', this.column).innerText = this.filename;

        for (const vCard of vcfData.matchAll(this.#cardRegex)) {
            const contact = new Contact(vCard[0]);

            ui.element('.contacts', this.column).append(contact.vCard());
        }
    }
}
