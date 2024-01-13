const decoder = new TextDecoder();

class ContactDetail {
    template = document.querySelector<HTMLTemplateElement>('#vcard-contact-detail').content;
    vcard: HTMLElement;

    constructor(contactClone) {
        this.vcard = contactClone;
    }

    add(items) {
        for (const item of items) {
            const elements = this.#makeNodes(item);

            this.vcard.querySelector('ul').append(elements);
        }
    }

    #makeNodes(item) {
        const clone = this.template.cloneNode(true) as HTMLElement;

        clone.querySelector<HTMLElement>('.contact-detail-title').innerText = item.type;
        clone.querySelector<HTMLElement>('.contact-detail-value').innerText = item.value;

        return clone;
    }
}
export default class Contact {
    #defaultPhoto = 'images/avatar.png';
    photo: string;

    fullName: string;
    nameRaw: string;
    nameComputed: string;
    firstName: string;
    lastName: string;
    middleNames: string;
    namePrefix: string;
    nameSuffix: string;

    organisation: string;
    title: string;

    addresses = [];
    emails = [];
    phoneNumbers = [];

    rawData: string;
    hasInvalidLines: boolean = false;
    template = document.querySelector<HTMLTemplateElement>('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true) as HTMLElement,
            sections = new ContactDetail(clone);
        let organisation = this.organisation || '';

        if (organisation && this.title) {
            organisation = `${this.title}, ${organisation}`
        }

        clone.querySelector('h3').innerText = this.fullName || this.emails[0]?.value || 'Unknown';
        clone.querySelector('em').innerText = organisation || this.title || '';
        clone.querySelector('img').src = this.photo || this.#defaultPhoto;
        clone.toString = () => this.rawData;

        this.phoneNumbers.length && sections.add(this.phoneNumbers);
        this.addresses.length && sections.add(this.addresses);
        this.emails.length && sections.add(this.emails);

        if (this.hasInvalidLines) {
            console.error(`Unknown lines in contact:\n\n${this.rawData}`);
        }

        return clone;
    }

    #parseLines() {
        // Split continuous lines on CRLF followed by space or tab.
        // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
        const unfolded = this.rawData.replace(/\r\n[\t\u0020]/g, '');

        for (const line of unfolded.split('\r\n')) {
            const [param, value] = line.split(/:(.*)/);

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
                case 'ORG': this.#extractOrganisation(line); break;
                case 'TITLE': this.#extractJobTitle(value); break;
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

    #parseArgsFromParam(param) {
        const [field, ...args] = param.split(';');

        const transformed = args.map((arg) => {
            let [name, value] = arg.split('=', 2);

            if (!value && 'PREF' !== name) {
                [name, value] = [value, name];
            }

            return {name, value};
        });

        return [field, transformed];
    }

    #processFlagsFromFieldOptions(options, value) {
        const field = {isPreferred: false, type: '', value};

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

    #maybeDecode(value, args = []) {
        const argsObject: {ENCODING?: string} = {};

        for (const {name, value} of args) {
            argsObject[name] = value;
        }

        if (!Object.hasOwn(argsObject, 'ENCODING')) {
            return value;
        }

        if ('QUOTED-PRINTABLE' === argsObject.ENCODING) {
            const bytes = [...value.matchAll(/=([A-F0-9]{2})/gi)].map(hex => parseInt(hex[1], 16));

            return decoder.decode(new Uint8Array(bytes));
        }

        console.warn(`Unhandled content encoding '${argsObject.ENCODING}' for value '${value}'`);
    }

    #extractEmail(email, options) {
        this.emails.push(
            this.#processFlagsFromFieldOptions(options, email)
        );
    }

    #extractFullName(value, args = []) {
        value = this.#maybeDecode(value, args);

        if (value !== this.nameComputed) {
            value += ` (${this.firstName} ${this.lastName})`;
        }

        this.fullName = value;
    }

    #extractName(value, args = []) {
        const [_, last, first, middle, prefix, suffix] = value.match(/(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/),
            parts = [prefix, first, middle, last, suffix].filter(v => v).map(
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

    #extractAddress(value, args = []) {
        const address: {
            raw?, poBox?, suite?, street?, locality?, region?, postCode?, countryName?, value
        } = this.#processFlagsFromFieldOptions(args, value),
            parts = value.match(/(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/),
            printable = parts.slice(1).filter(v => v).map(
                part => this.#maybeDecode(part.trim(), args)
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
        ] = [...parts, printable], address));
    }

    #extractOrganisation(line) {
        this.organisation = line.substring(4);
    }
    #extractJobTitle(value) {
        this.title = value;
    }

    #extractPhone(number, options) {
        this.phoneNumbers.push(
            this.#processFlagsFromFieldOptions(options, number)
        );
    }

    #extractBase64Photo(data) {
        this.photo = `data:image/jpg;base64,${data}`;
    }
};
