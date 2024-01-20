import {decodeQuotedPrintable} from "./vcards/encoding.js";
import {Parameter as FieldOption, Property, VCardProperty, parameterParser} from "./vcards/properties.js";
import PhotoValue from "./vcards/properties/photo.js";
import * as ui from "./ui.js";

type FieldValue = {
    isPreferred?: boolean;
    type: string;
    value: string;
}

function bridge(properties: VCardProperty[]): FieldValue[] {
    return properties.map((property) => ({
        type: property.parameters.find((p) => 'TYPE' === p.name || !p.name)?.value || '',
        value: property.value.formatted,
    }));
}

class ContactDetail {
    template = ui.template('#vcard-contact-detail').content;
    vcard: HTMLElement;

    constructor(contactClone: HTMLElement) {
        this.vcard = contactClone;
    }

    add(items: FieldValue[]) {
        for (const item of items) {
            const elements = this.#makeNodes(item);

            ui.element('ul', this.vcard).append(elements);
        }
    }

    #makeNodes(item: FieldValue) {
        const clone = this.template.cloneNode(true) as HTMLElement;

        ui.element('.contact-detail-title', clone).innerText = item.type;
        ui.element('.contact-detail-value', clone).innerText = item.value;

        return clone;
    }
}

export default class Contact {
    fullName: string = '';

    rawData: string;
    properties: VCardProperty[];
    hasInvalidLines: boolean = false;
    template = ui.template('#vcard-contact').content;

    constructor(rawData: string, properties: VCardProperty[]) {
        this.rawData = rawData;
        this.properties = properties;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true) as HTMLElement,
            addresses = bridge(this.#props(Property.address)),
            emails = bridge(this.#props(Property.email)),
            phones = bridge(this.#props(Property.phone)),
            title = this.#prop(Property.orgTitle),
            sections = new ContactDetail(clone);
        let organisation = this.#prop(Property.orgName);

        if (organisation && title) {
            organisation = `${title}, ${organisation}`
        }

        ui.element('h3', clone).innerText = this.fullName || emails[0]?.value || 'Unknown';
        ui.element('em', clone).innerText = organisation || title;
        ui.image('img', clone).src = this.#prop(Property.photo) || PhotoValue.default();
        clone.toString = () => this.rawData;

        phones.length && sections.add(phones);
        addresses.length && sections.add(addresses);
        emails.length && sections.add(emails);

        if (this.hasInvalidLines) {
            console.error(`Unknown lines in contact:\n\n${this.rawData}`);
        }

        return clone;
    }

    #prop(property: Property): string {
        return this.properties.find((p) => p.name === property)?.value.formatted || '';
    }

    #props(property: Property) {
        return this.properties.filter((p) => p.name === property);
    }

    #parseLines() {
        // Split continuous lines on CRLF followed by space or tab.
        // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
        const unfolded = this.rawData.replace(/\r\n[\t\u0020]/g, '');

        for (const line of unfolded.split('\r\n')) {
            const [param, value] = <[string, string]>line.split(/:(.*)/);

            if ('' === line.trim() || ['BEGIN', 'END', 'VERSION'].includes(param)) {
                continue;
            }

            let [field, args] = this.#parseArgsFromParam(param);

            switch(field) {
                case 'FN': this.#extractFullName(value, args); break;
                default:
                    console.warn(`Unhandled VCF line: '${line}'`);
                    this.hasInvalidLines = true;
            }
        }
    }

    #parseArgsFromParam(param: string): [string, FieldOption[]] {
        const [field, ...args] = <[string, ...[string]]>param.split(';');

        return [field, args.map(parameterParser)];
    }

    #maybeDecode(value: string, args: FieldOption[] = []): string {
        const argsObject: {ENCODING?: string, [key: string]: string} = {};

        for (const {name, value} of args) {
            argsObject[name] = value;
        }

        if (!Object.hasOwn(argsObject, 'ENCODING')) {
            return value;
        }

        if ('QUOTED-PRINTABLE' === argsObject.ENCODING) {
            return decodeQuotedPrintable(value);
        }

        throw new Error(`Unhandled content encoding '${argsObject.ENCODING}' for value '${value}'`);
    }

    #extractFullName(value: string, args: FieldOption[] = []) {
        const full = this.#prop(Property.name);

        value = this.#maybeDecode(value, args);

        if (value !== full) {
            value += ` (${full})`;
        }

        this.fullName = value;
    }
};
