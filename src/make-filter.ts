import { checkQuery } from './operators';

// TODO: type me better
export const makeFilter = (query: any) => (obj: any) => checkQuery(query, obj);
