const ALLOWED = /[֐-׿a-z0-9-]/g;
export function slugifyName(input) {
    const lower = input.toLowerCase().trim().normalize("NFC");
    const hyphenated = lower.replace(/\s+/g, "-");
    const cleaned = (hyphenated.match(ALLOWED) || []).join("");
    const collapsed = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return collapsed || "user";
}
export function makeUniqueUserId(base, taken) {
    if (!taken.has(base))
        return base;
    let n = 2;
    while (taken.has(`${base}-${n}`))
        n++;
    return `${base}-${n}`;
}
