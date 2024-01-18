import {Property, VCardProperty} from "./vcards/properties.js";
import * as ui from "./ui.js";

const decoder = new TextDecoder();

type FieldOption = {
    name: string;
    value: string;
}
type FieldValue = {
    isPreferred?: boolean;
    type: string;
    value: string;
}
type AddressField = FieldValue & {
    raw?: string;
    poBox: string;
    suite: string;
    street: string;
    locality: string;
    region: string;
    postCode: string;
    countryName: string;
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
    #defaultPhoto = 'images/avatar.png';
    photo: string = '';

    fullName: string = '';
    nameRaw: string = '';
    nameComputed: string = '';
    firstName: string = '';
    lastName: string = '';
    middleNames: string = '';
    namePrefix: string = '';
    nameSuffix: string = '';

    addresses: AddressField[] = [];
    emails: FieldValue[] = [];
    phoneNumbers: FieldValue[] = [];

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
            title = this.#prop(Property.orgTitle),
            sections = new ContactDetail(clone);
        let organisation = this.#prop(Property.orgName);

        if (organisation && title) {
            organisation = `${title}, ${organisation}`
        }

        ui.element('h3', clone).innerText = this.fullName || this.emails[0]?.value || 'Unknown';
        ui.element('em', clone).innerText = organisation || title;
        ui.image('img', clone).src = this.photo || this.#defaultPhoto;
        clone.toString = () => this.rawData;

        this.phoneNumbers.length && sections.add(this.phoneNumbers);
        this.addresses.length && sections.add(this.addresses);
        this.emails.length && sections.add(this.emails);

        if (this.hasInvalidLines) {
            console.error(`Unknown lines in contact:\n\n${this.rawData}`);
        }

        return clone;
    }

    #prop(prop: Property): string {
        return this.properties.find((p) => p.name === prop)?.value || '';
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
                case 'N': this.#extractName(value, args); break;
                case 'FN': this.#extractFullName(value, args); break;
                case 'TEL': this.#extractPhone(value, args); break;
                case 'EMAIL': this.#extractEmail(value, args); break;
                case 'ADR': this.#extractAddress(value, args); break;
                case 'PHOTO':
                    // Todo: Move this to `#extractPhoto` and improve parsing
                    if (param === 'PHOTO;ENCODING=BASE64;JPEG') {
                        this.#extractBase64Photo(value);
                        break;
                    }
                default:
                    console.warn(`Unhandled VCF line: '${line}'`);
                    this.hasInvalidLines = true;
            }
        }
    }

    #parseArgsFromParam(param: string): [string, FieldOption[]] {
        const [field, ...args] = <[string, ...[string]]>param.split(';');

        const transformed = args.map((arg: string) => {
            let [name, value] = <[string, string]>arg.split('=', 2);

            if (!value && 'PREF' !== name) {
                [name, value] = [value, name];
            }

            return {name, value};
        });

        return [field, transformed];
    }

    #processFlagsFromFieldOptions(options: FieldOption[], value: string) {
        const field = <FieldValue>{isPreferred: false, type: '', value};

        for (const flag of options) {
            if ('PREF' === flag.name) {
                field.isPreferred = true;
                continue;
            }
            if (!flag.name || 'TYPE' === flag.name) {
                field.type = flag.value;
                continue;
            }
            console.warn(`Unhandled option for ${value}:`, flag);
        }

        return field;
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
            const bytes = [...value.matchAll(/=([A-F0-9]{2})/gi)].map(hex => parseInt(<string>hex[1], 16));

            return decoder.decode(new Uint8Array(bytes));
        }

        throw new Error(`Unhandled content encoding '${argsObject.ENCODING}' for value '${value}'`);
    }

    #extractEmail(email: string, options: FieldOption[]) {
        this.emails.push(
            this.#processFlagsFromFieldOptions(options, email)
        );
    }

    #extractFullName(value: string, args: FieldOption[] = []) {
        value = this.#maybeDecode(value, args);

        if (value !== this.nameComputed) {
            value += ` (${this.firstName} ${this.lastName})`;
        }

        this.fullName = value;
    }

    #extractName(value: string, args: FieldOption[] = []) {
        const [_, last, first, middle, prefix, suffix] = <RegExpMatchArray>value.match(
            /(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/
        ), parts = (<string[]>[prefix, first, middle, last, suffix].filter(v => v)).map(
            part => this.#maybeDecode(part.trim(), args)
        );

        this.nameComputed = parts.join(' ');
        this.nameRaw = value;

        this.namePrefix = prefix || '';
        this.firstName = first || '';
        this.middleNames = middle || '';
        this.lastName = last || '';
        this.nameSuffix = suffix || '';
    }

    #extractAddress(value: string, args: FieldOption[] = []) {
        const address = this.#processFlagsFromFieldOptions(args, value) as AddressField,
            parts = value.match(/(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/) || [],
            printable = parts.slice(1).filter((v: string): string => v).map(
                (part: string) => this.#maybeDecode(part.trim(), args)
            ).join(', ');

        this.addresses.push(([
            address.raw,
            address.poBox,
            address.suite,
            address.street,
            address.locality,
            address.region,
            address.postCode,
            address.countryName,
            address.value,
        ] = <[string, string, string, string, string, string, string, string, string]>[
            ...parts,
            printable,
        ], address));
    }

    #extractPhone(number: string, options: {name: string, value: string}[]) {
        this.phoneNumbers.push(
            this.#processFlagsFromFieldOptions(options, number)
        );
    }

    #extractBase64Photo(data: string) {
        this.photo = `data:image/jpg;base64,${data}`;
    }
};
