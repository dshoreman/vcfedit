import Contact from "./contact";
import * as ui from "./ui.js";
import VCard from "./vcard";
import {Property} from "./vcards/properties.js";

export default class MergeWindow {
    contacts: {left: Contact, right: Contact};
    dialog: HTMLDialogElement;
    newVCard: VCard;
    oldVCard: VCard;

    constructor(oldVCard: VCard, oldContact: Contact, newVCard: VCard, newContact: Contact) {
        this.contacts = {left: oldContact.clone(), right: newContact.clone()};
        this.dialog = ui.element('#merge') as any as HTMLDialogElement;
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

    #generateColumnHTML = (contact: Contact, side: 'left' | 'right') => contact.appendPropertiesHTML(
        'merge-contact-detail',
        ui.element(`.compare-${side}`, this.dialog),
        item => ({name: item.human, value: item.value.toHTML(), params: item.paramString}),
        (row, property) => {
            ui.element('.merge-row-name', row).prepend(ui.icon(property.icon));
            ui.element(`.merge-row-${side === 'left' ? 'value' : 'name'}`, row).before(this.#generateButtons(side));
        });

    #markForMerging(event: MouseEvent, from: 'left'|'right') {
        const row = <HTMLElement>(<HTMLElement>event.target).parentElement?.parentElement,
            to = from === 'left' ? 'right' : 'left';

        this.contacts[from].moveProperty(
            this.contacts[to],
            ui.element('.merge-row-name', row).innerText as Property,
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
