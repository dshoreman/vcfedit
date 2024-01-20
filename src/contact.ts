import {Property, VCardProperty} from "./vcards/properties.js";
import PhotoValue from "./vcards/properties/photo.js";
import * as ui from "./ui.js";

class ContactDetail {
    template = ui.template('#vcard-contact-detail').content;
    vcard: HTMLElement;

    constructor(contactClone: HTMLElement) {
        this.vcard = contactClone;
    }

    add(items: VCardProperty[]) {
        if (!items.length) {
            return;
        }

        for (const item of items) {
            const elements = this.#makeNodes(item);

            ui.element('ul', this.vcard).append(elements);
        }
    }

    #makeNodes(item: VCardProperty) {
        const clone = this.template.cloneNode(true) as HTMLElement;

        ui.element('.contact-detail-title', clone).innerText = item.type();
        ui.element('.contact-detail-value', clone).innerText = item.value.formatted;

        return clone;
    }
}

export default class Contact {
    rawData: string;
    properties: VCardProperty[];
    hasInvalidLines: boolean = false;
    template = ui.template('#vcard-contact').content;

    constructor(rawData: string, properties: VCardProperty[]) {
        this.rawData = rawData;
        this.properties = properties;
    }

    vCard() {
        const clone = this.template.cloneNode(true) as HTMLElement,
            sections = new ContactDetail(clone);

        ui.element('h3', clone).innerText = this.#displayAs();
        ui.element('em', clone).innerText = this.#displayOrg();
        ui.image('img', clone).src = this.#prop(Property.photo) || PhotoValue.default();
        clone.toString = () => this.rawData;

        sections.add(this.#props(Property.phone));
        sections.add(this.#props(Property.address));
        sections.add(this.#props(Property.email));

        return clone;
    }

    #displayAs() {
        const n = this.#prop(Property.name),
            fn = this.#prop(Property.formattedName);

        if (n && fn && n !== fn) {
            return `${fn} (${n})`;
        }
        if (n || fn) {
            return fn || n;
        }

        return this.#prop(Property.email) || 'Unknown';
    }

    #displayOrg() {
        const title = this.#prop(Property.orgTitle),
            organisation = this.#prop(Property.orgName);

        if (organisation && title) {
            return `${title}, ${organisation}`;
        }

        return organisation || title;
    }

    #prop(property: Property): string {
        return this.properties.find((p) => p.name === property)?.value.formatted || '';
    }

    #props(property: Property) {
        return this.properties.filter((p) => p.name === property);
    }
};
