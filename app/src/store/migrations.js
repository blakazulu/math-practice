export function migrate(input) {
    if (input == null || typeof input !== "object") {
        return { version: 1, activeUserId: null, users: {} };
    }
    const obj = input;
    if (typeof obj.version !== "number") {
        return { version: 1, activeUserId: null, users: {} };
    }
    if (obj.version === 1) {
        return input;
    }
    if (obj.version > 1) {
        throw new Error(`Unknown persist version: ${obj.version}. Refusing to clobber.`);
    }
    return { version: 1, activeUserId: null, users: {} };
}
