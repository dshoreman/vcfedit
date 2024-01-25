import Contact from "./contact";
import * as ui from "./ui.js";

export default class MergeWindow {
    dialog: HTMLDialogElement;
    newContact: Contact;
    oldContact: Contact;

    constructor(oldContact: Contact, newContact: Contact) {
        this.dialog = <HTMLDialogElement>ui.element('#merge');

        this.newContact = newContact;
        this.oldContact = oldContact;
    }

    generateHTML() {
        return this.#generateColumnHTML(this.oldContact)
             + this.#generateColumnHTML(this.newContact);
    }

    show() {
        ui.element('button.close', this.dialog).onclick = () => this.dialog.close();
        ui.element('.compare', this.dialog).innerHTML = this.generateHTML();

        this.dialog.showModal();
    }

    #generateColumnHTML(contact: Contact) {
        let html = '';

        for (const {name, parameters, value} of contact.properties) {
            html += `<div class="merge-row">
                <div class="merge-row-name">${name}</div>
                <div class="merge-row-params">${parameters.map(p => {
                    if (p.name && p.value) return `${p.name}=${p.value}`;
                    else return p.name || p.value;
                }).join(', ')}</div>
                <div class="merge-row-value">${value.formatted}</div>
            </div>`;
        }

        return `<div class="merge-column">${html}</div>`;
    }
}
