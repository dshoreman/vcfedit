import Contact from "./contact";
import * as ui from "./ui.js";
import VCard from "./vcard";
import {HiddenPropertyFilter} from "./vcards/properties.js";

export default class MergeWindow {
    contacts: {left: Contact, right: Contact};
    dialog: HTMLDialogElement;
    newVCard: VCard;
    oldVCard: VCard;

    constructor(oldVCard: VCard, oldContact: Contact, newVCard: VCard, newContact: Contact) {
        this.contacts = {left: oldContact.clone(), right: newContact.clone()};
        this.dialog = <HTMLDialogElement>ui.element('#merge');
        this.newVCard = newVCard;
        this.oldVCard = oldVCard;
    }

    #generateButtons(from: 'left' | 'right') {
        const button = document.createElement('button'),
            buttons = document.createElement('div');

        button.innerText = {left: '>', right: '<'}[from];
        button.onclick = (event) => this.#markForMerging(event, from);
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

    #markForMerging(event: MouseEvent, from: 'left'|'right') {
        const row = <HTMLElement>(<HTMLElement>event.target).parentElement?.parentElement,
            to = from === 'left' ? 'right' : 'left';

        this.contacts[from].moveProperty(
            this.contacts[to],
            ui.element('.merge-row-name', row).innerText,
            ui.element('.merge-row-value', row).innerText,
        );

        this.#refreshColumn(this.contacts.left, 'left');
        this.#refreshColumn(this.contacts.right, 'right');
    }

    #merge() {
        this.#refreshColumn(this.contacts.left, 'left', this.oldVCard);
        this.#refreshColumn(this.contacts.right, 'right', this.newVCard);

        this.dialog.close();
    }

    #refreshColumn(contact: Contact, side: 'left' | 'right', card?: VCard) {
        ui.element(`.compare-${side}`, this.dialog).innerHTML = '';

        if (card) {
            card.refreshContact(contact);
        }

        this.#generateColumnHTML(contact, side);
    }

    show() {
        ui.element('button.close', this.dialog).onclick = () => this.dialog.close();
        ui.element('button.confirm', this.dialog).onclick = () => this.#merge();

        this.#refreshColumn(this.contacts.left, 'left');
        this.#refreshColumn(this.contacts.right, 'right');

        this.dialog.showModal();
    }
}
