// matches elasticsearch date math expressions like "now-30d" or "2011||+1m/d"
// group 1 -> either "now" or a date string followed by "||"
// group 2 -> optional math expression (i.e. "1y+6m-2d")
// group 3 -> optional unit to round down to (i.e. "d")
export const dateMathPartsRegex = /^((?:[\dT:\+\-Z]*\|{2})|(?:now))((?:[+-]\d+[yMwdhHms])*)*\/?([yMwdhHms])?$/;

// matches individual math terms like "+1d" or "-2m"
// group 1 -> operator, "+" or "-"
// group 2 -> number
// group 3 -> unit, "d", "m", etc.
const dateMathTermsRegex = /([+-])(\d+)([yMwdhHms])/g;

// looks for trailing "Z" or UTC offset
const explicitTimeZoneRegex = /Z$|[+-]\d\d:\d\d$/;

export const parseDateMath = (value: string): number => {
    const [_, nowOrDate, math, roundTo] = value.match(dateMathPartsRegex) ?? [];

    if (!nowOrDate) {
        throw new Error('Expected valid date math expression.');
    }

    const dateSansPipes = nowOrDate.slice(0, -2);

    // make sure to preserve any explicit timezone offset (or Z),
    // and default to UTC (Z) when no explicit timezone is present
    const date =
        nowOrDate === 'now' ? new Date() : new Date(explicitTimeZoneRegex.test(dateSansPipes) ? dateSansPipes : `${dateSansPipes}Z`);

    if (math) {
        for (const match of math.matchAll(dateMathTermsRegex)) {
            const [, operator, number, unit] = match;
            const amount = Number(number) * (operator === '-' ? -1 : 1);

            switch (unit) {
                // seconds
                case 's':
                    date.setSeconds(date.getSeconds() + amount);
                    break;

                // minutes
                case 'm':
                    date.setMinutes(date.getMinutes() + amount);
                    break;

                // hours
                case 'h':
                case 'H':
                    date.setHours(date.getHours() + amount);
                    break;

                // days
                case 'd':
                    date.setDate(date.getDate() + amount);
                    break;

                // weeks
                case 'w':
                    date.setDate(date.getDate() + amount * 7);
                    break;

                // months
                case 'M': {
                    const originalDay = date.getUTCDate();
                    const targetMonth = date.getUTCMonth() + amount;

                    date.setUTCDate(1);
                    date.setUTCMonth(targetMonth);

                    const lastDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

                    date.setUTCDate(Math.min(originalDay, lastDayOfMonth));
                    break;
                }

                // years
                case 'y': {
                    const originalDay = date.getUTCDate();
                    const originalMonth = date.getUTCMonth();

                    date.setUTCDate(1);
                    date.setUTCFullYear(date.getUTCFullYear() + amount, originalMonth);

                    const lastDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), originalMonth + 1, 0)).getUTCDate();

                    date.setUTCDate(Math.min(originalDay, lastDayOfMonth));
                    break;
                }

                default:
                    throw new Error(`Unsupported unit: ${unit}`);
            }
        }
    }

    if (roundTo) {
        switch (roundTo) {
            case 'y':
                date.setUTCMonth(0);
                date.setUTCDate(1);
                date.setUTCHours(0, 0, 0, 0);
                break;

            case 'M':
                date.setUTCDate(1);
                date.setUTCHours(0, 0, 0, 0);
                break;

            case 'w': {
                date.setUTCHours(0, 0, 0, 0);
                const day = date.getUTCDay(); // 0 = Sunday
                date.setUTCDate(date.getUTCDate() - day);
                break;
            }

            case 'd':
                date.setUTCHours(0, 0, 0, 0);
                break;

            case 'h':
            case 'H':
                date.setUTCMinutes(0, 0, 0);
                break;

            case 'm':
                date.setUTCSeconds(0, 0);
                break;

            case 's':
                date.setUTCMilliseconds(0);
                break;

            default:
                throw new Error(`Unsupported round unit: ${roundTo}`);
        }
    }

    return date.getTime();
};
