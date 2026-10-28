const isObj = (obj: unknown): obj is Record<string, any> => !!obj && typeof obj === 'object' && !Array.isArray(obj);

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
        if (Array.isArray(nestedExp) && (nestedKey === '$and' || nestedKey === '$or' || nestedKey === '$nor')) {
            q[nestedKey] = nestedExp.map(exp => expandNestedArrayExps(exp));
        } else if (nestedKey === '$not') {
            q[nestedKey] = expandNestedArrayExps(nestedExp);
        } else if (nestedExp.$elemMatch) {
            const expandedAllExps: any[] = [];
            const expandedNinExps: any[] = [];
            const nonExpandedExps: any = {};
            Object.entries<any>(nestedExp.$elemMatch).forEach(([field, exp]) => {
                const hasAll = isObj(exp) && Array.isArray(exp.$all);
                const hasNin = isObj(exp) && Array.isArray(exp.$nin);
                if (hasAll) {
                    expandedAllExps.push(...exp.$all.map((value: any) => ({ [field]: value })));
                }
                if (hasNin) {
                    expandedNinExps.push(...exp.$nin.map((value: any) => ({ [field]: value })));
                }
                if (!hasAll && !hasNin) {
                    // preserve sibling conditions (including operator objects like { $eq: 'x' })
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

            q[nestedKey] = { $elemMatch: expandNestedArrayExps(nestedExp.$elemMatch) };
        } else {
            q[nestedKey] = nestedExp;
        }
    });

    return q;
};
