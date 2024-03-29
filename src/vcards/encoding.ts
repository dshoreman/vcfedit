import {Parameter} from "./properties.js";

const encoder = new TextEncoder(),
    decoder = new TextDecoder();

export function decodeComponents<T extends {[key: string]: string}>(
    components: T,
    parameters: Parameter[],
): T {
    for (const [key, value] of Object.entries(components)) {
        Object.assign(components, {[key]: decodeString(value, parameters)});
    }

    return components;
}

export function decodeString(value: string, parameters: Parameter[]) {
    const encoding = parameters.find(p => 'ENCODING' === p.name)?.value;

    if ('QUOTED-PRINTABLE' === encoding) {
        return decodeQuotedPrintable(value);
    }

    return value;
}

export function decodeQuotedPrintable(value: string) {
    const bytes = [...value.matchAll(/=([A-F0-9]{2})/gi)].map(
        hex => parseInt(<string>hex[1], 16),
    );

    return decoder.decode(new Uint8Array(bytes));
}

export function encodeComponents<T extends {[key: string]: string}>(
    components: T,
    parameters: Parameter[],
): T {
    for (const [key, value] of Object.entries(components)) {
        Object.assign(components, {[key]: encodeString(value, parameters)});
    }

    return components;
}

export function encodeString(value: string, parameters: Parameter[]): string {
    const encoding = parameters.find(p => 'ENCODING' === p.name)?.value;

    if ('QUOTED-PRINTABLE' === encoding) {
        return encodeQuotedPrintable(value);
    }

    return value;
}

export function encodeQuotedPrintable(value: string) {
    let encoded = '';

    encoder.encode(value).forEach((byte: number) => {
        encoded += `=${byte.toString(16).toUpperCase()}`;
    });

    return encoded;
}
