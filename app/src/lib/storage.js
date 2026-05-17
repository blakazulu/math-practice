export const STORAGE_KEY = "math-practice:v1";
export function readPersist() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (e) {
        console.error("storage: failed to read", e);
        return null;
    }
}
export function writePersist(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch (e) {
        console.error("storage: failed to write", e);
    }
}
export function clearPersist() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch (e) {
        console.error("storage: failed to clear", e);
    }
}
