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

    #generateButtons(side: 'left' | 'right') {
        const button = document.createElement('button'),
            buttons = document.createElement('div');

        button.innerText = {left: '>', right: '<'}[side];
        button.onclick = (ev) => this.#handleMerge(side, ev as MouseEvent & {target: HTMLElement});
        buttons.className = 'merge-row-buttons';
        buttons.append(button);

        return buttons;
    }

    #generateColumnHTML = (contact: Contact, side: 'left' | 'right') =>
        contact.properties.filter(HiddenPropertyFilter).forEach(({name, parameters, value}) => {
            const before = side === 'left' ? 'value' : 'name',
            row = ui.applyValues('merge-contact-detail', { name, params: parameters.map(
                p => (p.name && p.value) ? `${p.name}=${p.value}` : p.name || p.value
            ).join(', '), value: value.formatted });

            ui.element(`.merge-row-${before}`, row).before(this.#generateButtons(side));
            ui.element(`.compare-${side}`, this.dialog).appendChild(row);
        });

    #handleMerge(fromSide: 'left' | 'right', ev: MouseEvent & {target: HTMLElement}) {
        const contacts = {left: this.oldContact, right: this.newContact},
            row = <HTMLElement>ev.target.parentElement?.parentElement,
            name = ui.element('.merge-row-name', row).innerText,
            value = ui.element('.merge-row-value', row).innerText,
            otherSide = fromSide === 'left' ? 'right' : 'left',
            property = contacts[fromSide].properties.find(p =>
                p.name === name && p.value.formatted === value
            );

        if (!property) {
            throw new Error("Couldn't find property '${name}' with value '${value}'")
        }

        contacts[otherSide].properties.push(property);
        this.#refreshColumn(contacts[otherSide], otherSide);
    }

    #refreshColumn(contact: Contact, side: 'left' | 'right') {
        ui.element(`.compare-${side}`, this.dialog).innerHTML = '';

        this.#generateColumnHTML(contact, side);
    }

    show() {
        ui.element('button.close', this.dialog).onclick = () => this.dialog.close();

        this.#generateColumnHTML(this.oldContact, 'left');
        this.#generateColumnHTML(this.newContact, 'right');

        this.dialog.showModal();
    }
}
