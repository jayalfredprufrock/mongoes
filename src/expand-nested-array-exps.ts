/*
Hacky way to allow $all/$nin operators to work as expected
when used within $elemMatch queries. It looks for queries
of this form:

{ works: { $elemMatch: { bpm: 130, keys: { $all: ["C","C#"] } } } }

and converts them into an expanded form:

{
    $and: [
        { works: { $elemMatch: { bpm: 130, keys: "C" } } },
        { works: { $elemMatch: { bpm: 130, keys: "C#" } } }
    ]
}

so that the following document would match
{
    works: [
        { bpm: 130, keys: "C" },
        { bpm: 130, keys: "C#" }
    ]
}

*/
export const expandNestedArrayExps = (query: any): any => {
    const q: any = {};
    Object.entries<any>(query).forEach(([nestedKey, nestedExp]) => {
        if (nestedExp.$elemMatch) {
            const expandedAllExps: any[] = [];
            const expandedNinExps: any[] = [];
            const nonExpandedExps: any = {};
            Object.entries<any>(nestedExp.$elemMatch).forEach(([field, exp]) => {
                if (exp && typeof exp === 'object') {
                    if (Array.isArray(exp.$all)) {
                        expandedAllExps.push(...exp.$all.map((value: any) => ({ [field]: value })));
                    }
                    if (Array.isArray(exp.$nin)) {
                        expandedNinExps.push(...exp.$nin.map((value: any) => ({ [field]: value })));
                    }
                } else {
                    nonExpandedExps[field] = exp;
                }
            });

            if (expandedAllExps.length) {
                if (!q.$and) {
                    q.$and = [];
                }
                expandedAllExps.forEach(exp => {
                    q.$and.push({
                        [nestedKey]: {
                            $elemMatch: { ...exp, ...nonExpandedExps },
                        },
                    });
                });
            }

            if (expandedNinExps.length) {
                if (!q.$nor) {
                    q.$nor = [];
                }
                expandedNinExps.forEach(exp => {
                    q.$nor.push({
                        [nestedKey]: {
                            $elemMatch: { ...exp, ...nonExpandedExps },
                        },
                    });
                });
            }

            if (expandedAllExps.length || expandedNinExps.length) {
                return;
            }
        }
        q[nestedKey] = nestedExp;
    });

    return q;
};
