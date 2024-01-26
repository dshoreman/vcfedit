import Contact from "./contact";
import * as ui from "./ui.js";
import {HiddenPropertyFilter} from "./vcards/properties.js";

export default class MergeWindow {
    dialog: HTMLDialogElement;
    newContact: Contact;
    oldContact: Contact;

    constructor(oldContact: Contact, newContact: Contact) {
        this.dialog = <HTMLDialogElement>ui.element('#merge');

        this.newContact = newContact;
        this.oldContact = oldContact;
    }

    #generateColumnHTML = (contact: Contact, side: 'left'|'right') =>
        contact.properties.filter(HiddenPropertyFilter)
            .forEach(({name, parameters, value}) => ui.element(`.compare-${side}`, this.dialog)
                .appendChild(ui.applyValues('merge-contact-detail', {
                    name, value: value.formatted, params: parameters.map(
                        p => (p.name && p.value) ? `${p.name}=${p.value}` : p.name || p.value
                    ).join(', ')})));

    show() {
        ui.element('button.close', this.dialog).onclick = () => this.dialog.close();

        this.#generateColumnHTML(this.oldContact, 'left');
        this.#generateColumnHTML(this.newContact, 'right');

        this.dialog.showModal();
    }
}
