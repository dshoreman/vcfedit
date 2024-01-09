export default class Contact {
    #defaultPhoto = 'avatar.png';
    template = document.querySelector('#vcard-contact').content;

    constructor(rawData) {
        this.rawData = rawData;

        this.#parseLines();
    }

    vCard() {
        const clone = this.template.cloneNode(true);

        clone.querySelector('h3').innerText = this.fullName;
        clone.querySelector('img').src = this.photo || this.#defaultPhoto;
        clone.querySelector('em').innerText = this.phone || '';
        clone.querySelector('span').innerText = this.email?.address || '';
        clone.querySelector('p').innerText = this.organisation || '';
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

            switch(param.split(';')[0]) {
                case 'N': this.#extractName(line); break;
                case 'FN': this.#extractFullName(line); break;
                case 'TEL': this.#extractPhone(line); break;
                case 'EMAIL': this.#extractEmail(param, value); break;
                case 'ORG': this.#extractOrganisation(line); break;
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

    #extractEmail(param, value) {
        const email = { address: value, isPreferred: false, type: '' }
        let args = param.substring(6).split(';');

        if (args.includes('PREF')) {
            args.splice(args.indexOf('PREF'), 1);
            email.isPreferred = true;
        }

        if (1 === args.length) {
            email.type = args[0];
            args.splice(0, 1);
        }

        if (args.length) {
            console.warn(`Email has unexpected args:\n ${param}:${value}`);
        }

        this.email = email;
    }

    #extractFullName(line) {
        this.fullName = line.replace('FN:', '');

        if (this.fullName !== `${this.firstName} ${this.lastName}`.trim()) {
            this.fullName += ` (${this.firstName} ${this.lastName})`;
        }
    }

    #extractName(line) {
        const [_, last, first, middle, prefix, suffix] =
            line.match(/N:(.*)?;(.*)?;(.*)?;(.*)?;(.*)?/);

        this.namePrefix = prefix || '';
        this.firstName = first || '';
        this.middleNames = middle || '';
        this.lastName = last || '';
        this.nameSuffix = suffix || '';
        this.nameRaw = line.substring(2);
    }

    #extractOrganisation(line) {
        this.organisation = line.substring(4);
    }

    #extractPhone(line) {
        this.phone = line.replace('TEL;CELL:', '');
    }

    #extractBase64Photo(data) {
        this.photo = `data:image/jpg;base64,${data}`;
    }
};
