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
    id: string;
    rawData: string;
    properties: VCardProperty[];
    hasInvalidLines: boolean = false;
    template = ui.template('#vcard-contact').content;

    constructor(rawData: string, properties: VCardProperty[]) {
        this.id = `contact-${Math.random().toString(36).slice(2, 9)}`;
        this.rawData = rawData;
        this.properties = properties;
    }

    clone() {
        const clone = new Contact(this.rawData, [...this.properties]);

        clone.id = this.id;

        return clone;
    }

    moveProperty(contact: Contact, propname: Property, value: string) {
        const oldIndex = this.properties.findIndex(p =>
            p.name === propname && p.value.formatted === value
        ), property = this.properties.splice(oldIndex, 1)[0] as VCardProperty,
        targetIndex = contact.lastPropertyIndex(propname) || contact.lastPropertyIndex(oldIndex);

        if (!targetIndex) {
            const vCardEnd = <VCardProperty>contact.properties.pop();

            contact.properties.push(property, vCardEnd)

            return;
        }

        contact.properties = [
            ...contact.properties.slice(0, targetIndex + 1),
            property,
            ...contact.properties.slice(targetIndex + 1),
        ];
    }

    download() {
        const a = document.createElement('a'),
            data = this.export() + '\r\n';

        a.setAttribute('download', `${this.#displayAs().replace(' ', '-').toLowerCase()}.vcf`);
        a.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
        a.style.display = 'none';

        document.body.appendChild(a).click();
        document.body.removeChild(a);
    }

    export() {
        const data = [];

        for (const property of this.properties || []) {
            data.push(property.export());
        }

        return data.join('\r\n');
    }

    lastPropertyIndex(search: Property|number): number|void {
        let index = this.properties.length;

        if (typeof search === 'number')  {
            search = this.properties[search]?.name || 0;
        }
        while (search && index--) {
            if (search === this.properties[index]?.name) {
                return index;
            }
        }

        return;
    }

    vCard() {
        const clone = this.template.cloneNode(true) as HTMLElement,
            sections = new ContactDetail(clone);

        ui.element('.contact', clone).id = this.id;
        ui.element('h3', clone).innerText = this.#displayAs();
        ui.element('em', clone).innerText = this.#displayOrg();
        ui.image('img', clone).src = this.#prop(Property.photo) || PhotoValue.default();

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
