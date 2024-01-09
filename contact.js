export default class Contact {
    #defaultPhoto = 'avatar.png';
    emails = [];
    phoneNumbers = [];
    template = document.querySelector('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true);
        let organisation = this.organisation || '';

        if (organisation && this.title) {
            organisation = `${this.title}, ${organisation}`
        }

        clone.querySelector('h3').innerText = this.fullName || this.emails[0]?.value || 'Unknown';
        clone.querySelector('img').src = this.photo || this.#defaultPhoto;
        clone.querySelector('em').innerText = this.phoneNumbers[0]?.value || '';
        clone.querySelector('span').innerText = this.emails[0]?.value || '';
        clone.querySelector('p').innerText = organisation || this.title || '';
        clone.toString = () => this.rawData;

        return clone;
    }

    #parseLines() {
        // Split continuous lines on CRLF followed by space or tab.
        // Section 3.2 of RFC 6350: "Line Delimiting and Folding".
        const unfolded = this.rawData.replace(/\r\n[\t\u0020]/g, '');

        for (const line of unfolded.split('\r\n')) {
            const [param, value] = line.split(':', 2);

            if ('' === line.trim() || ['BEGIN', 'END', 'VERSION'].includes(param)) {
                continue;
            }

            let [field, args] = this.#parseArgsFromParam(param);

            switch(field) {
                case 'N': this.#extractName(line); break;
                case 'FN': this.#extractFullName(line); break;
                case 'TEL': this.#extractPhone(value, args); break;
                case 'EMAIL': this.#extractEmail(value, args); break;
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

    #extractEmail(email, options) {
        this.emails.push(
            this.#processFlagsFromFieldOptions(options, email)
        );
    }

    #extractFullName(line) {
        this.fullName = line.replace('FN:', '');

        if (this.fullName !== this.nameComputed) {
            this.fullName += ` (${this.firstName} ${this.lastName})`;
        }
    }

    #extractName(line) {
        const [_, last, first, middle, prefix, suffix] =
            line.match(/N:(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/);

        let parts = [];

        for (const part of [prefix, first, middle, last, suffix]) {
            part && parts.push(part);
        }

        this.nameComputed = parts.join(' ');
        this.nameRaw = line.substring(2);

        this.namePrefix = prefix || '';
        this.firstName = first || '';
        this.middleNames = middle || '';
        this.lastName = last || '';
        this.nameSuffix = suffix || '';
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
