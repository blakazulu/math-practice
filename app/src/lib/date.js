export function formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
export function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
export function diffInDays(aIso, bIso) {
    const [ay, am, ad] = aIso.split("-").map(Number);
    const [by, bm, bd] = bIso.split("-").map(Number);
    const aMs = Date.UTC(ay, am - 1, ad);
    const bMs = Date.UTC(by, bm - 1, bd);
    return Math.round((bMs - aMs) / 86400000);
}
export function todayLocal() {
    return formatLocalDate(new Date());
}
