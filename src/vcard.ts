import Contact from "./contact.js";

export default class VCard {
    #cardRegex = /BEGIN:VCARD([\w\W]*?)END:VCARD/g;
    column: HTMLDivElement;
    filename: string;

    constructor(filename, parentColumn) {
        this.filename = filename;
        this.column = parentColumn;
    }

    process(vcfData) {
        this.column.querySelector('h2').innerText = this.filename;

        for (const vCard of vcfData.matchAll(this.#cardRegex)) {
            const contact = new Contact(vCard[0]);

            this.column.querySelector('.contacts').append(contact.vCard());
        }
    }
}
