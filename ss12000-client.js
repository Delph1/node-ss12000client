// ss12000-client.js
/**
 * @file Node.js client package for the SS12000 API.
 * This package contains functions that allows for a solution to easily integrate with the SS12000 API
 * based on the available OpenAPI specification.
 * This includes basic HTTP calls and handling of Bearer Token authentication.
 */

let fetchImpl;
try {
    // node-fetch v2 (CJS) exports function, v3 is ESM so may expose default
    fetchImpl = require('node-fetch');
    if (fetchImpl && fetchImpl.default) fetchImpl = fetchImpl.default;
} catch (e) {
    // Fallback to global fetch (Node 18+)
    if (typeof fetch !== 'undefined') fetchImpl = fetch;
    else throw new Error('node-fetch not installed and global fetch not available');
}
const fetch = fetchImpl;

/**
 * SS12000 API Client
 * @class
 * @param {string} baseUrl - Base URL for the SS12000 API server.
 * @param {string} authToken - JWT Bearer Token.
 */
class SS12000Client {
    constructor(baseUrl, authToken) {
        if (!baseUrl) {
            throw new Error('Base URL is mandatory for the SS12000Client.');
        }
        
        if (!baseUrl.startsWith('https://')) {
            console.warn('Varning: Base URL is not using HTTPS. This is insecure and very much NOT recommended.');
        }
        
        if (!authToken) {
            console.warn('Warning: Authentication token missing. Calls can fail if the API requires authentication.');
        }
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (authToken) {
            this.headers['Authorization'] = `Bearer ${authToken}`;
        }
    }

    /**
     * Perform a generic GET call to the API.
     * @private
     * @param {string} path - API path (e.g. "/organisations").
     * @param {Object} [params={}] - Query parameter.
     * @returns {Promise<Object>} - API response.
     * @throws {Error} If fail = Error.
     */
    async _get(path, params = {}) {
        const url = new URL(`${this.baseUrl}${path}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers,
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error when performing GET call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Perform a generic POST call to the API.
     * @private
     * @param {string} path - API path (e.g. "/organisations/lookup").
     * @param {Object} body - Request body.
     * @returns {Promise<Object>} - API response.
     * @throws {Error} If fail = Error.
     */
    async _post(path, body) {
        const url = new URL(`${this.baseUrl}${path}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error when performing POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Perform a generic DELETE call to the API.
     * @private
     * @param {string} path - API path (e.g. "/attendances/{id}").
     * @returns {Promise<void>} - No return when successful.
     * @throws {Error} if fail = Error.
     */
    async _delete(path) {
        const url = new URL(`${this.baseUrl}${path}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: this.headers,
            });

            if (response.status === 204) {
                return; // 204 No Content indicates successful deletion
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
        } catch (error) {
            console.error(`Error when performing DELETE call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Perform a generic PATCH call to the API.
     * @private
     * @param {string} path - API path (e.g. "/subscriptions/{id}").
     * @param {Object} body - Request body.
     * @returns {Promise<Object>} - API response.
     * @throws {Error} if fail = error.
     */
    async _patch(path, body) {
        const url = new URL(`${this.baseUrl}${path}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error when performing PATCH call to ${url.toString()}:`, error);
            throw error;
        }
    }

    // --- Organisation Endpoints ---

    /**
     * Hämta en lista med organisationer.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} [params.parent] 
     * @param {string[]} [params.schoolUnitCode] 
     * @param {string[]} [params.organisationCode] 
     * @param {string} [params.municipalityCode] 
     * @param {string[]} [params.type] - e.g. "Huvudman", "Skolenhet".
     * @param {string[]} [params.schoolTypes] 
     * @param {string} [params.startDateOnOrBefore] 
     * @param {string} [params.startDateOnOrAfter] 
     * @param {string} [params.endDateOnOrBefore] 
     * @param {string} [params.endDateOnOrAfter] 
     * @param {string} [params.metaCreatedBefore] 
     * @param {string} [params.metaCreatedAfter] 
     * @param {string} [params.metaModifiedBefore] 
     * @param {string} [params.metaModifiedAfter] 
     * @param {boolean} [params.expandReferenceNames] 
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of organisations.
     */
    async getOrganisations(params = {}) {
        const mappedParams = {
            'parent': params.parent,
            'schoolUnitCode': params.schoolUnitCode,
            'organisationCode': params.organisationCode,
            'municipalityCode': params.municipalityCode,
            'type': params.type,
            'schoolTypes': params.schoolTypes,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/organisations', mappedParams);
    }

    /**
     * Fetch many organisations based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of organisation IDs.
     * @param {string[]} [body.schoolUnitCodes] - List of school unit codes.
     * @param {string[]} [body.organisationCodes] - List of organisation codes.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all refered objects.
     * @returns {Promise<Object>} - A list of organisations.
     */
    async lookupOrganisations(body, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        const url = new URL(`${this.baseUrl}/organisations/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error when performing POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Fetch an organisation based on ID.
     * @param {string} id - ID for the organisation.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all refered objects.
     * @returns {Promise<Object>} - Organisation objects.
     */
    async getOrganisationById(id, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        return this._get(`/organisations/${id}`, params);
    }

    // --- Person Endpoints ---

    /**
     * Fetch a list of persons.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} [params.nameContains] 
     * @param {string} [params.civicNo] 
     * @param {string} [params.eduPersonPrincipalName]
     * @param {string} [params.identifierValue] - references `externalIdentifiers.value`.
     * @param {string} [params.identifierContext] - references `externalIdentifiers.context`.
     * @param {string} [params.relationshipEntityType]
     * @param {string} [params.relationshipOrganisation]
     * @param {string} [params.relationshipStartDateOnOrBefore] - RFC 3339 format
     * @param {string} [params.relationshipStartDateOnOrAfter] - RFC 3339 format
     * @param {string} [params.relationshipEndDateOnOrBefore] - RFC 3339 format
     * @param {string} [params.relationshipEndDateOnOrAfter] - RFC 3339 format
     * @param {string} [params.metaCreatedBefore] - Endast poster skapade på eller före detta timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Endast poster skapade efter detta timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Endast poster modifierade på eller före detta timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Endast poster modifierade efter detta timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Beskriver om expanderade data ska hämtas (t.ex. "duties", "responsibleFor").
     * @param {boolean} [params.expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @param {string} [params.sortkey] - Anger hur resultatet ska sorteras (t.ex. "DisplayNameAsc", "ModifiedDesc").
     * @param {number} [params.limit] - Antal poster som ska visas i resultatet.
     * @param {string} [params.pageToken] - Ett opakt värde som servern givit som svar på en tidigare ställd fråga.
     * @returns {Promise<Object>} - En lista med personer.
     */
    async getPersons(params = {}) {
        const mappedParams = {
            'nameContains': params.nameContains,
            'civicNo': params.civicNo,
            'eduPersonPrincipalName': params.eduPersonPrincipalName,
            'identifier.value': params.identifierValue,
            'identifier.context': params.identifierContext,
            'relationship.entity.type': params.relationshipEntityType,
            'relationship.organisation': params.relationshipOrganisation,
            'relationship.startDate.onOrBefore': params.relationshipStartDateOnOrBefore,
            'relationship.startDate.onOrAfter': params.relationshipStartDateOnOrAfter,
            'relationship.endDate.onOrBefore': params.relationshipEndDateOnOrBefore,
            'relationship.endDate.onOrAfter': params.relationshipEndDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/persons', mappedParams);
    }

    /**
     * Get multiple persons based on a list of IDs or civic numbers.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of person IDs.
     * @param {string[]} [body.civicNos] - List of civic numbers.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of persons.
     */
    async lookupPersons(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/persons/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error when performing POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a person by person ID.
     * @param {string} id - ID of the person.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The person object.
     */
    async getPersonById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/persons/${id}`, params);
    }

 // --- Placements Endpoints ---

    /**
     * Get a list of placements.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} [params.child] - List of child IDs.
     * @param {string[]} [params.group] - List of group IDs.
     * @param {string[]} [params.owner] - List of owner IDs.
     * @param {string} [params.placedAt] - ID of the organisation where the placement is made.
     * @param {string} [params.schoolType] - School type (e.g. "Gymnasieskola", "Grundskola").
     * @param {string} [params.startDateOnOrBefore] - Only placements starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only placements starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only placements ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only placements ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only placements created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only placements created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only placements modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only placements modified after this timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of placements.
     */
    async getPlacements(params = {}) {
        const mappedParams = {
            'child': params.child,
            'group': params.group,
            'owner': params.owner,
            'placedAt': params.placedAt,
            'schoolType': params.schoolType,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/placements', mappedParams);
    }

    /**
     * Get multiple placements based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of placement IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of placements.
     */
    async lookupPlacements(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/placements/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a placement by ID.
     * @param {string} id - ID of the placement.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The placement object.
     */
    async getPlacementById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/placements/${id}`, params);
    }

    // --- Duties Endpoints ---

    /**
     * Get a list of duties.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} [params.person] - List of person IDs.
     * @param {string[]} [params.dutyAt] - List of organisation IDs where the duty is performed.
     * @param {string[]} [params.dutyRole] - List of duty roles (e.g. "Teacher", "Principal").
     * @param {string} [params.signature] - Signature of the duty.
     * @param {string} [params.startDateOnOrBefore] - Only duties starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only duties starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only duties ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only duties ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only duties created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only duties created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only duties modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only duties modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "person", "dutyAt").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of duties.
     */
    async getDuties(params = {}) {
        const mappedParams = {
            'person': params.person,
            'dutyAt': params.dutyAt,
            'dutyRole': params.dutyRole,
            'signature': params.signature,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/duties', mappedParams);
    }

    /**
     * Get multiple duties based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of duty IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of duties.
     */
    async lookupDuties(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/duties/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a duty by ID.
     * @param {string} id - ID of the duty.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The duty object.
     */
    async getDutyById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/duties/${id}`, params);
    }

    // --- Groups Endpoints ---

    /**
     * Get a list of groups.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} [params.groupType] - List of group types (e.g. "Class", "Course").
     * @param {string[]} [params.schoolType] - List of school types (e.g. "Gymnasieskola", "Grundskola").
     * @param {string[]} [params.organisation] - List of organisation IDs.
     * @param {string} [params.startDateOnOrBefore] - Only groups starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only groups starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only groups ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only groups ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only groups created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only groups created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only groups modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only groups modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "members", "teachers").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of groups.
     */
    async getGroups(params = {}) {
        const mappedParams = {
            'groupType': params.groupType,
            'schoolType': params.schoolType,
            'organisation': params.organisation,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/groups', mappedParams);
    }

    /**
     * Get multiple groups based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of group IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of groups.
     */
    async lookupGroups(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/groups/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a group by ID.
     * @param {string} id - ID of the group.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The group object.
     */
    async getGroupById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/groups/${id}`, params);
    }

    // --- Programmes Endpoints ---

    /**
     * Get a list of programmes.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.nameContains] - Filter by programme name.
     * @param {string} [params.type] - Programme type (e.g. "Gymnasieprogram", "Grundskoleprogram").
     * @param {string} [params.parentProgramme] - ID of the parent programme.
     * @param {string} [params.schoolType] - School type (e.g. "Gymnasieskola", "Grundskola").
     * @param {string} [params.code] - Programme code.
     * @param {string} [params.metaCreatedBefore] - Only programmes created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only programmes created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only programmes modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only programmes modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "parentProgramme", "schoolType").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of programmes.
     */
    async getProgrammes(params = {}) {
        const mappedParams = {
            'nameContains': params.nameContains,
            'type': params.type,
            'parentProgramme': params.parentProgramme,
            'schoolType': params.schoolType,
            'code': params.code,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/programmes', mappedParams);
    }

    /**
     * Get multiple programmes based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of programme IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of programmes.
     */
    async lookupProgrammes(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/programmes/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a programme by ID.
     * @param {string} id - ID of the programme.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The programme object.
     */
    async getProgrammeById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/programmes/${id}`, params);
    }

    // --- StudyPlans Endpoints ---

    /**
     * Get a list of study plans.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.student] - ID of the student.
     * @param {string} [params.startDateOnOrBefore] - Only study plans starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only study plans starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only study plans ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only study plans ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only study plans created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only study plans created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only study plans modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only study plans modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "student", "courses").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of study plans.
     */
    async getStudyPlans(params = {}) {
        const mappedParams = {
            'student': params.student,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/studyplans', mappedParams);
    }

    /**
     * Get multiple study plans based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of study plan IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of study plans.
     */
    async lookupStudyPlans(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/studyplans/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a study plan by ID.
     * @param {string} id - ID of the study plan.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The study plan object.
     */
    async getStudyPlanById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/studyplans/${id}`, params);
    }

    // --- Syllabuses Endpoints ---

    /**
     * Get a list of syllabuses.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.schoolType] - School type (e.g. "Gymnasieskola", "Grundskola").
     * @param {string} [params.subjectCode] - Subject code.
     * @param {string} [params.subjectNameContains] - Filter by subject name.
     * @param {string} [params.subjectDesignation] - Subject designation (e.g. "Mathematics", "History").
     * @param {string} [params.courseCode] - Course code.
     * @param {string} [params.courseNameContains] - Filter by course name.
     * @param {string} [params.startSchoolYearOnOrBefore] - Only syllabuses starting on or before this school year (RFC 3339 format).
     * @param {string} [params.startSchoolYearOnOrAfter] - Only syllabuses starting after this school year (RFC 3339 format).
     * @param {string} [params.endSchoolYearOnOrBefore] - Only syllabuses ending on or before this school year (RFC 3339 format).
     * @param {string} [params.endSchoolYearOnOrAfter] - Only syllabuses ending after this school year (RFC 3339 format).
     * @param {string} [params.pointsOnOrBefore] - Only syllabuses with points on or before this value.
     * @param {string} [params.pointsOnOrAfter] - Only syllabuses with points on or after this value.
     * @param {string} [params.curriculum] - Curriculum (e.g. "Lgr11", "Gy11").
     * @param {string} [params.languageCode] - Language code (e.g. "sv", "en").
     * @param {boolean} [params.official] - Only official syllabuses.
     * @param {string} [params.metaCreatedBefore] - Only syllabuses created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only syllabuses created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only syllabuses modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only syllabuses modified after this timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show. 
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of syllabuses.
     */
    async getSyllabuses(params = {}) {
        const mappedParams = {
            'schoolType': params.schoolType,
            'subjectCode': params.subjectCode,
            'subjectNameContains': params.subjectNameContains,
            'subjectDesignation': params.subjectDesignation,
            'courseCode': params.courseCode,
            'courseNameContains': params.courseNameContains,
            'startSchoolYear.onOrBefore': params.startSchoolYearOnOrBefore,
            'startSchoolYear.onOrAfter': params.startSchoolYearOnOrAfter,
            'endSchoolYear.onOrBefore': params.endSchoolYearOnOrBefore,
            'endSchoolYear.onOrAfter': params.endSchoolYearOnOrAfter,
            'points.onOrBefore': params.pointsOnOrBefore,
            'points.onOrAfter': params.pointsOnOrAfter,
            'curriculum': params.curriculum,
            'languageCode': params.languageCode,
            'official': params.official,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/syllabuses', mappedParams);
    }

    /**
     * Get multiple syllabuses based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of syllabus IDs.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of syllabuses.
     */
    async lookupSyllabuses(body, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        const url = new URL(`${this.baseUrl}/syllabuses/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a syllabus by ID.
     * @param {string} id - ID of the syllabus.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The syllabus object.
     */
    async getSyllabusById(id, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        return this._get(`/syllabuses/${id}`, params);
    }

    // --- SchoolUnitOfferings Endpoints ---

    /**
     * Get a list of school unit offerings.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.offeredAt] - ID of the organisation where the school unit is offered.
     * @param {string[]} [params.offeredSyllabuses] - List of syllabus IDs that the school unit is offering.
     * @param {string[]} [params.offeredProgrammes] - List of programme IDs that the school unit is offering.
     * @param {string} [params.startDateOnOrBefore] - Only offerings starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only offerings starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only offerings ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only offerings ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only offerings created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only offerings created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only offerings modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only offerings modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "offeredAt", "offeredSyllabuses", "offeredProgrammes").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show. 
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of school unit offerings.
     */
    async getSchoolUnitOfferings(params = {}) {
        const mappedParams = {
            'offeredAt': params.offeredAt,
            'offeredSyllabuses': params.offeredSyllabuses,
            'offeredProgrammes': params.offeredProgrammes,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/schoolUnitOfferings', mappedParams);
    }

    /**
     * Get multiple school unit offerings based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of school unit offering IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of school unit offerings.
     */
    async lookupSchoolUnitOfferings(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/schoolUnitOfferings/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a school unit offering by ID.
     * @param {string} id - ID of the school unit offering.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The school unit offering object.
     */
    async getSchoolUnitOfferingById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/schoolUnitOfferings/${id}`, params);
    }

    // --- Activities Endpoints ---

    /**
     * Get a list of activities.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.organisation] - ID of the organisation.
     * @param {string} [params.syllabus] - ID of the syllabus.
     * @param {string} [params.activityType] - Type of the activity (e.g. "Lecture", "Exercise").
     * @param {boolean} [params.calendarEventsRequired] - Only activities with calendar events required.
     * @param {string} [params.startDateOnOrBefore] - Only activities starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only activities starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only activities ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only activities ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only activities created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only activities created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only activities modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only activities modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "syllabus", "organisation").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show. 
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of activities.
     */
    async getActivities(params = {}) {
        const mappedParams = {
            'organisation': params.organisation,
            'syllabus': params.syllabus,
            'activityType': params.activityType,
            'calendarEventsRequired': params.calendarEventsRequired,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/activities', mappedParams);
    }

    /**
     * Get multiple activities based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of activity IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of activities.
     */
    async lookupActivities(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/activities/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get an activity by ID.
     * @param {string} id - ID of the activity.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The activity object.
     */
    async getActivityById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/activities/${id}`, params);
    }

    // --- CalendarEvents Endpoints ---

    /**
     * Get a list of calendar events.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.activity] - ID of the activity.
     * @param {string} [params.startTimeOnOrBefore] - Only events starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startTimeOnOrAfter] - Only events starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endTimeOnOrBefore] - Only events ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endTimeOnOrAfter] - Only events ending after this timestamp (RFC 3339 format).
     * @param {boolean} [params.cancelled] - Only cancelled events.
     * @param {string} [params.room] - ID of the room.
     * @param {string} [params.resource] - ID of the resource.
     * @param {string} [params.metaCreatedBefore] - Only events created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only events created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only events modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only events modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "activity", "room", "resource").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of calendar events.
     */
    async getCalendarEvents(params = {}) {
        const mappedParams = {
            'activity': params.activity,
            'startTime.onOrBefore': params.startTimeOnOrBefore,
            'startTime.onOrAfter': params.startTimeOnOrAfter,
            'endTime.onOrBefore': params.endTimeOnOrBefore,
            'endTime.onOrAfter': params.endTimeOnOrAfter,
            'cancelled': params.cancelled,
            'room': params.room,
            'resource': params.resource,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/calendarEvents', mappedParams);
    }

    /**
     * Get multiple calendar events based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of calendar event IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of calendar events.
     */
    async lookupCalendarEvents(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/calendarEvents/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a calendar event by ID.
     * @param {string} id - ID of the calendar event.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The calendar event object.
     */
    async getCalendarEventById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/calendarEvents/${id}`, params);
    }

    // --- Attendances Endpoints ---

    /**
     * Get a list of attendances.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.calendarEvent] - ID of the calendar event.
     * @param {string} [params.student] - ID of the student.
     * @param {string} [params.reporter] - ID of the reporter.
     * @param {boolean} [params.isReported] - Only reported attendances.
     * @param {string} [params.reportedTimestampOnOrBefore] - Only attendances reported on or before this timestamp (RFC 3339 format).
     * @param {string} [params.reportedTimestampOnOrAfter] - Only attendances reported after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only attendances created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only attendances created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only attendances modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only attendances modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "calendarEvent", "student", "reporter").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of attendances.
     */
    async getAttendances(params = {}) {
        const mappedParams = {
            'calendarEvent': params.calendarEvent,
            'student': params.student,
            'reporter': params.reporter,
            'isReported': params.isReported,
            'reportedTimestamp.onOrBefore': params.reportedTimestampOnOrBefore,
            'reportedTimestamp.onOrAfter': params.reportedTimestampOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/attendances', mappedParams);
    }

    /**
     * Get multiple attendances based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of attendance IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of attendances.
     */
    async lookupAttendances(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/attendances/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get an attendance by ID.
     * @param {string} id - ID of the attendance.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The attendance object.
     */
    async getAttendanceById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/attendances/${id}`, params);
    }

    /**
     * Delete an attendance by ID.
     * @param {string} id - ID of the attendance to delete.
     * @returns {Promise<void>}
     */
    async deleteAttendance(id) {
        return this._delete(`/attendances/${id}`);
    }

    // --- AttendanceEvents Endpoints ---

    /**
     * Get a list of attendance events.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.person] - ID of the person.
     * @param {string} [params.registeredBy] - ID of the person who registered the attendance event.
     * @param {string} [params.group] - ID of the group.
     * @param {string} [params.room] - ID of the room.
     * @param {string} [params.timeOnOrBefore] - Only events on or before this timestamp (RFC 3339 format).
     * @param {string} [params.timeOnOrAfter] - Only events on or after this timestamp (RFC 3339 format).
     * @param {string} [params.eventType] - Type of the event (e.g. "Arrival", "Departure").
     * @param {string} [params.metaCreatedBefore] - Only events created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only events created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only events modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only events modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "person", "registeredBy", "group", "room").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of attendance events.
     */
    async getAttendanceEvents(params = {}) {
        const mappedParams = {
            'person': params.person,
            'registeredBy': params.registeredBy,
            'group': params.group,
            'room': params.room,
            'time.onOrBefore': params.timeOnOrBefore,
            'time.onOrAfter': params.timeOnOrAfter,
            'eventType': params.eventType,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/attendanceEvents', mappedParams);
    }

    /**
     * Get multiple attendance events based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of attendance event IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of attendance events.
     */
    async lookupAttendanceEvents(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/attendanceEvents/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get an attendance event by ID.
     * @param {string} id - ID of the attendance event.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The attendance event object.
     */
    async getAttendanceEventById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/attendanceEvents/${id}`, params);
    }

    // --- AttendanceSchedules Endpoints ---

    /**
     * Get a list of attendance schedules.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.placement] - ID of the placement.
     * @param {number} [params.numberOfWeeksOnOrBefore] - Only schedules with number of weeks on or before this value.
     * @param {number} [params.numberOfWeeksOnOrAfter] - Only schedules with number of weeks on or after this value.
     * @param {string} [params.startDateOnOrBefore] - Only schedules starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only schedules starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only schedules ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only schedules ending after this timestamp (RFC 3339 format).
     * @param {boolean} [params.temporary] - Only temporary schedules.
     * @param {string} [params.state] - State of the schedule (e.g. "Active", "Inactive").
     * @param {string} [params.metaCreatedBefore] - Only schedules created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only schedules created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only schedules modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only schedules modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "placement").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of attendance schedules.
     */
    async getAttendanceSchedules(params = {}) {
        const mappedParams = {
            'placement': params.placement,
            'numberOfWeeks.onOrBefore': params.numberOfWeeksOnOrBefore,
            'numberOfWeeks.onOrAfter': params.numberOfWeeksOnOrAfter,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'temporary': params.temporary,
            'state': params.state,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/attendanceSchedules', mappedParams);
    }

    /**
     * Get multiple attendance schedules based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of attendance schedule IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of attendance schedules.
     */
    async lookupAttendanceSchedules(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/attendanceSchedules/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get an attendance schedule by ID.
     * @param {string} id - ID of the attendance schedule.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The attendance schedule object.
     */
    async getAttendanceScheduleById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/attendanceSchedules/${id}`, params);
    }

    // --- Grades Endpoints ---

    /**
     * Get a list of grades.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.student] - ID of the student.
     * @param {string} [params.schoolUnit] - ID of the school unit.
     * @param {string} [params.registeredBy] - ID of the person who registered the grade.
     * @param {string} [params.gradingTeacher] - ID of the teacher who graded the student.
     * @param {string} [params.group] - ID of the group.
     * @param {string} [params.registeredDateOnOrBefore] - Only grades registered on or before this timestamp (RFC 3339 format).
     * @param {string} [params.registeredDateOnOrAfter] - Only grades registered after this timestamp (RFC 3339 format).
     * @param {string} [params.gradeValue] - Value of the grade (e.g. "A", "B", "C").
     * @param {boolean} [params.finalGrade] - Only final grades.
     * @param {boolean} [params.trial] - Only trial grades.
     * @param {boolean} [params.adaptedStudyPlan] - Only grades from adapted study plans.
     * @param {string} [params.correctionType] - Type of correction (e.g. "Normal", "Reassessment").
     * @param {boolean} [params.converted] - Only converted grades.
     * @param {string} [params.semester] - Semester of the grade (e.g. "1", "2").
     * @param {string} [params.yearOnOrBefore] - Only grades from years on or before this value.
     * @param {string} [params.yearOnOrAfter] - Only grades from years on or after this value.
     * @param {string} [params.syllabus] - ID of the syllabus.
     * @param {string} [params.metaCreatedBefore] - Only grades created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only grades created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only grades modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only grades modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "student", "schoolUnit", "gradingTeacher").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of grades.
     */
    async getGrades(params = {}) {
        const mappedParams = {
            'student': params.student,
            'schoolUnit': params.schoolUnit,
            'registeredBy': params.registeredBy,
            'gradingTeacher': params.gradingTeacher,
            'group': params.group,
            'registeredDate.onOrBefore': params.registeredDateOnOrBefore,
            'registeredDate.onOrAfter': params.registeredDateOnOrAfter,
            'gradeValue': params.gradeValue,
            'finalGrade': params.finalGrade,
            'trial': params.trial,
            'adaptedStudyPlan': params.adaptedStudyPlan,
            'correctionType': params.correctionType,
            'converted': params.converted,
            'semester': params.semester,
            'year.onOrBefore': params.yearOnOrBefore,
            'year.onOrAfter': params.yearOnOrAfter,
            'syllabus': params.syllabus,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/grades', mappedParams);
    }

    /**
     * Get multiple grades based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of grade IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of grades.
     */
    async lookupGrades(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/grades/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a grade by ID.
     * @param {string} id - ID of the grade.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The grade object.
     */
    async getGradeById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/grades/${id}`, params);
    }

    // --- AggregatedAttendance Endpoints ---

    /**
     * Get a list of aggregated attendances.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.activity] - ID of the activity.
     * @param {string} [params.student] - ID of the student.
     * @param {string} [params.startDateOnOrBefore] - Only aggregated attendances starting on or before this timestamp (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - Only aggregated attendances starting after this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - Only aggregated attendances ending on or before this timestamp (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - Only aggregated attendances ending after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only aggregated attendances created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only aggregated attendances created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only aggregated attendances modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only aggregated attendances modified after this timestamp (RFC 3339 format).
     * @param {string[]} [params.expand] - Describes if expanded data should be fetched (e.g. "activity", "student").
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of aggregated attendances.
     */
    async getAggregatedAttendances(params = {}) {
        const mappedParams = {
            'activity': params.activity,
            'student': params.student,
            'startDate.onOrBefore': params.startDateOnOrBefore,
            'startDate.onOrAfter': params.startDateOnOrAfter,
            'endDate.onOrBefore': params.endDateOnOrBefore,
            'endDate.onOrAfter': params.endDateOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expand': params.expand,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/aggregatedAttendance', mappedParams);
    }

    /**
     * Get multiple aggregated attendances based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of aggregated attendance IDs.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of aggregated attendances.
     */
    async lookupAggregatedAttendances(body, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        const url = new URL(`${this.baseUrl}/aggregatedAttendance/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(item => url.searchParams.append(key, item));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get an aggregated attendance by ID.
     * @param {string} id - ID of the aggregated attendance.
     * @param {string[]} [expand] - Describes if expanded data should be fetched.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The aggregated attendance object.
     */
    async getAggregatedAttendanceById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/aggregatedAttendance/${id}`, params);
    }

    // --- Resources Endpoints ---

    /**
     * Get a list of resources.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.owner] - ID of the owner.
     * @param {string} [params.nameContains] - Filter by resource name containing this string.
     * @param {string} [params.metaCreatedBefore] - Only resources created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only resources created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only resources modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only resources modified after this timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of resources.
     */
    async getResources(params = {}) {
        const mappedParams = {
            'owner': params.owner,
            'nameContains': params.nameContains,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/resources', mappedParams);
    }

    /**
     * Get multiple resources based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of resource IDs.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of resources.
     */
    async lookupResources(body, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        const url = new URL(`${this.baseUrl}/resources/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a resource by ID.
     * @param {string} id - ID of the resource.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The resource object.
     */
    async getResourceById(id, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        return this._get(`/resources/${id}`, params);
    }

    // --- Rooms Endpoints ---

    /**
     * Get a list of rooms.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.owner] - ID of the owner.
     * @param {string} [params.nameContains] - Filter by room name containing this string.
     * @param {string} [params.metaCreatedBefore] - Only rooms created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only rooms created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only rooms modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only rooms modified after this timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all referenced objects.
     * @param {string} [params.sortkey] - Sort order (e.g. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of rooms.
     */
    async getRooms(params = {}) {
        const mappedParams = {
            'owner': params.owner,
            'nameContains': params.nameContains,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'expandReferenceNames': params.expandReferenceNames,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/rooms', mappedParams);
    }

    /**
     * Get multiple rooms based on a list of IDs.
     * @param {Object} body - Request body.
     * @param {string[]} [body.ids] - List of room IDs.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - A list of rooms.
     */
    async lookupRooms(body, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        const url = new URL(`${this.baseUrl}/rooms/lookup`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error during POST call to ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Get a room by ID.
     * @param {string} id - ID of the room.
     * @param {boolean} [expandReferenceNames] - Return `displayName` for all referenced objects.
     * @returns {Promise<Object>} - The room object.
     */
    async getRoomById(id, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        return this._get(`/rooms/${id}`, params);
    }

    // --- Subscriptions (Webhooks) Endpoints ---

    /**
     * Get a list of subscriptions.
     * @param {Object} [params={}] - Filter parameters.
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of subscriptions.
     */
    async getSubscriptions(params = {}) {
        return this._get('/subscriptions', params);
    }

    /**
     * Create a subscription.
     * @param {Object} body - Request body.
     * @param {string} body.name - A descriptive name of the webhook.
     * @param {string} body.target - POST URL for the webhook.
     * @param {Object[]} body.resourceTypes - List of resources types to subscribe to.
     * @param {string} body.resourceTypes[].resource - Resource type (e.g. "Organisation", "Person").
     * @returns {Promise<Object>} - The created subscription object.
     */
    async createSubscription(body) {
        return this._post('/subscriptions', body);
    }

    /**
     * Remove a subscription.
     * @param {string} id - ID of the subscription to remove.
     * @returns {Promise<void>}
     */
    async deleteSubscription(id) {
        return this._delete(`/subscriptions/${id}`);
    }

    /**
     * Get subscription with ID.
     * @param {string} id - ID of the subscription.
     * @returns {Promise<Object>} - Subscription object.
     */
    async getSubscriptionById(id) {
        return this._get(`/subscriptions/${id}`);
    }

    /**
     * Update 'expire time' of a specific subscription.
     * @param {string} id - ID of the subscription.
     * @param {Object} body - Request body (e.g. { expires: "2025-12-31T23:59:59Z" }).
     * @returns {Promise<Object>} - The updated subscription object.
     */
    async updateSubscription(id, body) {
        return this._patch(`/subscriptions/${id}`, body);
    }

    // --- DeletedEntities Endpoint ---

    /**
     * Get a list of deleted entities.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string[]} params.entities - List of entity types to query for deleted IDs.
     * @param {string} [params.metaModifiedAfter] - Only return entities deleted after this timestamp (RFC 3339 format).
     * @returns {Promise<Object>} - A list of deleted entities.
     */
    async getDeletedEntities(params = {}) {
        const mappedParams = {
            'entities': params.entities,
            'meta.modified.after': params.metaModifiedAfter,
        };
        return this._get('/deletedEntities', mappedParams);
    }

    // --- Log Endpoint ---

    /**
     * Get a list of log entries.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.source] - Source of the log entry.
     * @param {string} [params.target] - Target of the log entry.
     * @param {string} [params.eventType] - Type of the event (e.g. "Create", "Update", "Delete").
     * @param {string} [params.timestampOnOrBefore] - Only log entries on or before this timestamp (RFC 3339 format).
     * @param {string} [params.timestampOnOrAfter] - Only log entries on or after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only log entries created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only log entries created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only log entries modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only log entries modified after this timestamp (RFC 3339 format).
     * @param {string} [params.sortkey] - Sort order (e.g. "TimestampDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of log entries.
     */
    async getLog(params = {}) {
        const mappedParams = {
            'source': params.source,
            'target': params.target,
            'eventType': params.eventType,
            'timestamp.onOrBefore': params.timestampOnOrBefore,
            'timestamp.onOrAfter': params.timestampOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/log', mappedParams);
    }

    // --- Statistics Endpoint ---

    /**
     * Get a list of statistics.
     * @param {Object} [params={}] - Filter parameters.
     * @param {string} [params.source] - Source of the statistics.
     * @param {string} [params.target] - Target of the statistics.
     * @param {string} [params.statisticType] - Type of the statistic (e.g. "Attendance", "Grades").
     * @param {string} [params.timestampOnOrBefore] - Only statistics on or before this timestamp (RFC 3339 format).
     * @param {string} [params.timestampOnOrAfter] - Only statistics on or after this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - Only statistics created on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Only statistics created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Only statistics modified on or before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Only statistics modified after this timestamp (RFC 3339 format).
     * @param {string} [params.sortkey] - Sort order (e.g. "TimestampDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Number of entities to show.
     * @param {string} [params.pageToken] - An opaque value that the server has returned to a previous query.
     * @returns {Promise<Object>} - A list of statistics.
     */
    async getStatistics(params = {}) {
        const mappedParams = {
            'source': params.source,
            'target': params.target,
            'statisticType': params.statisticType,
            'timestamp.onOrBefore': params.timestampOnOrBefore,
            'timestamp.onOrAfter': params.timestampOnOrAfter,
            'meta.created.before': params.metaCreatedBefore,
            'meta.created.after': params.metaCreatedAfter,
            'meta.modified.before': params.metaModifiedBefore,
            'meta.modified.after': params.metaModifiedAfter,
            'sortkey': params.sortkey,
            'limit': params.limit,
            'pageToken': params.pageToken,
        };
        return this._get('/statistics', mappedParams);
    }
}

module.exports = SS12000Client;

// --- Exempel på webhook-mottagare (Express.js) ---
/**
 * @file Exempel på en enkel Express.js-server för att ta emot SS12000 webhooks.
 * Detta är en separat fil och är inte en del av klientbiblioteket.
 * Den visar hur man kan sätta upp en endpoint för att ta emot POST-anrop från SS12000 API:et.
 */

/*
// För att köra detta exempel, installera Express: npm install express
const express = require('express');
const bodyParser = require('body-parser');

const webhookApp = express();
const webhookPort = 3001; // Välj en port för din webhook-mottagare

// Använd body-parser för att parsa JSON-request bodies
webhookApp.use(bodyParser.json());

// Webhook-endpoint för SS12000 notifikationer
webhookApp.post('/ss12000-webhook', (req, res) => {
    console.log('Mottog en webhook från SS12000!');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Här kan du implementera din logik för att hantera webhook-meddelandet.
    // T.ex. spara informationen i en databas, trigga en uppdatering, etc.

    // Exempel på hur man kan hantera olika resurstyper i webhook-payloaden
    if (req.body && req.body.modifiedEntites) {
        req.body.modifiedEntites.forEach(resourceType => {
            console.log(`Ändringar för resurstyp: ${resourceType}`);
            // Här kan du anropa SS12000Client för att hämta den uppdaterade informationen
            // beroende på vilken resurstyp det gäller.
            // Exempel: if (resourceType === 'Person') { client.getPersons(...); }
        });
    }

    if (req.body && req.body.deletedEntities) {
        console.log('Det finns borttagna entiteter att hämta från /deletedEntities.');
        // Anropa client.getDeletedEntities(...) för att hämta de borttagna ID:na.
    }

    // Skicka tillbaka en 200 OK för att bekräfta mottagandet av webhooken
    res.status(200).send('Webhook mottagen framgångsrikt!');
});

// Starta webhook-servern
webhookApp.listen(webhookPort, () => {
    console.log(`SS12000 Webhook-mottagare lyssnar på http://localhost:${webhookPort}`);
});

// --- Exempel på användning av SS12000Client ---
async function runExample() {
    const baseUrl = 'http://some.server.se/v2.0'; // Ersätt med din testserver-URL
    const authToken = 'DIN_JWT_TOKEN_HÄR'; // Ersätt med din faktiska JWT-token

    const client = new SS12000Client(baseUrl, authToken);

    try {
        // Hämta organisationer
        console.log('\nHämtar organisationer...');
        const organisations = await client.getOrganisations({ limit: 5 });
        console.log('Hämtade organisationer:', JSON.stringify(organisations, null, 2));

        if (organisations.data && organisations.data.length > 0) {
            // Hämta en specifik organisation
            const firstOrgId = organisations.data[0].id;
            console(`\nHämtar organisation med ID: ${firstOrgId}...`);
            const organisation = await client.getOrganisationById(firstOrgId, true); // expandReferenceNames = true
            console.log('Hämtad organisation:', JSON.stringify(organisation, null, 2));

            // Exempel på lookup (om du har specifika ID:n att slå upp)
            // console.log('\nSlår upp organisationer med specifika ID:n...');
            // const lookedUpOrgs = await client.lookupOrganisations({ ids: [firstOrgId] });
            // console.log('Uppslagna organisationer:', JSON.stringify(lookedUpOrgs, null, 2));
        }

        // Hämta personer
        console.log('\nHämtar personer...');
        const persons = await client.getPersons({ limit: 5, expand: ['duties'] }); // Expandera tjänstgöringar
        console.log('Hämtade personer:', JSON.stringify(persons, null, 2));

        if (persons.data && persons.data.length > 0) {
            // Hämta en specifik person
            const firstPersonId = persons.data[0].id;
            console.log(`\nHämtar person med ID: ${firstPersonId}...`);
            const person = await client.getPersonById(firstPersonId, ['duties', 'responsibleFor'], true);
            console.log('Hämtad person:', JSON.stringify(person, null, 2));
        }

        // Exempel på att skapa en prenumeration (webhook)
        // Observera: Detta kräver att din webhook-mottagare är igång och tillgänglig via den angivna URL:en.
        // console.log('\nSkapar en prenumeration...');
        // const newSubscription = await client.createSubscription({
        //     name: 'Min Testprenumeration',
        //     target: 'http://your-public-webhook-url.com/ss12000-webhook', // Ersätt med din publika URL
        //     resourceTypes: [{ resource: 'Person' }, { resource: 'Activity' }]
        // });
        // console.log('Skapad prenumeration:', JSON.stringify(newSubscription, null, 2));

        // Hämta prenumerationer
        console.log('\nHämtar prenumerationer...');
        const subscriptions = await client.getSubscriptions();
        console.log('Hämtade prenumerationer:', JSON.stringify(subscriptions, null, 2));

        // Exempel på att uppdatera en prenumeration
        // if (subscriptions.data && subscriptions.data.length > 0) {
        //     const subToUpdate = subscriptions.data[0].id;
        //     const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Sätt utgångsdatum 7 dagar framåt
        //     console.log(`\nUppdaterar prenumeration ${subToUpdate} med nytt utgångsdatum: ${newExpiry}...`);
        //     const updatedSub = await client.updateSubscription(subToUpdate, { expires: newExpiry });
        //     console.log('Uppdaterad prenumeration:', JSON.stringify(updatedSub, null, 2));
        // }

        // Exempel på att ta bort en prenumeration
        // if (subscriptions.data && subscriptions.data.length > 0) {
        //     const subToDelete = subscriptions.data[0].id;
        //     console.log(`\nTar bort prenumeration med ID: ${subToDelete}...`);
        //     await client.deleteSubscription(subToDelete);
        //     console.log('Prenumeration borttagen framgångsrikt.');
        // }


    } catch (error) {
        console.error('Ett fel uppstod under exekveringen:', error.message);
    }
}

// runExample(); // Avkommentera för att köra exempelkoden
*/