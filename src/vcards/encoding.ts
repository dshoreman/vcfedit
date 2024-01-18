const decoder = new TextDecoder();

export function decodeQuotedPrintable(value: string) {
    const bytes = [...value.matchAll(/=([A-F0-9]{2})/gi)].map(
        hex => parseInt(<string>hex[1], 16),
    );

    return decoder.decode(new Uint8Array(bytes));
}
