export interface ValueFormatter {
    components?: any;
    formatted: string;
    original: string;
    extract(): string;
}

export class SimpleValue implements ValueFormatter {
    formatted: string;
    original: string;

    constructor(rawValue: string) {
        this.original = rawValue;
        this.formatted = this.extract();
    }

    extract = () => this.original;
}
