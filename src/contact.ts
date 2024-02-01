import {AllVisiblePropertiesFilter, OnlyExtraPropertiesFilter, Property, VCardProperty} from "./vcards/properties.js";
import PhotoValue from "./vcards/properties/photo.js";
import * as ui from "./ui.js";

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

        a.setAttribute('download', `${this.#displayPrimary().replace(' ', '-').toLowerCase()}.vcf`);
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
        const clone = this.template.cloneNode(true) as HTMLElement;

        ui.element('.contact', clone).id = this.id;
        ui.element('h3', clone).innerText = this.#displayPrimary();
        ui.element('em', clone).innerText = this.#displaySecondary();
        ui.image('img', clone).src = this.#prop(Property.photo) || PhotoValue.default();

        this.appendPropertiesHTML('vcard-contact-detail', ui.element('ul', clone), item => ({
            icon: item.icon,
            type: item.type(),
            value: item.value.formatted,
        }), (row, property) => {
            ui.element('i', row).title = property.human;
        }, OnlyExtraPropertiesFilter);

        return clone;
    }

    appendPropertiesHTML(
        template: string,
        parentElement: HTMLElement,
        propertyMapper: (property: VCardProperty) => {[key: string]: string},
        beforeAppend?: ((row: HTMLElement, property: VCardProperty) => void)|null,
        filter: (value: VCardProperty, index: number, array: VCardProperty[]) => boolean = AllVisiblePropertiesFilter,
    ) {
        this.properties.filter(filter).forEach(property => {
            const row = ui.applyValues(template, propertyMapper(property));

            if (beforeAppend) {
                beforeAppend(row, property);
            }

            parentElement.appendChild(row);
        });
    }

    #displayPrimary() {
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

    #displaySecondary() {
        const [email, phone, title, organisation] = [
            this.#prop(Property.email),
            this.#prop(Property.phone),
            this.#prop(Property.orgTitle),
            this.#prop(Property.orgName),
        ];

        if (phone || email) {
            return phone || email;
        }
        if (organisation && title) {
            return `${title}, ${organisation}`;
        }
        if (organisation || title) {
            return organisation || title;
        }

        return this.properties[0]?.value.formatted || '';
    }

    #prop(property: Property): string {
        return this.properties.find((p) => p.name === property)?.value.formatted || '';
    }
};
