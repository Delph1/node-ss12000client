// ss12000-client.js
/**
 * @file Node.js client package for the SS12000 API.
 * This package contains functions that allows for a solution to easily integrate with the SS12000 API
 * based on the available OpenAPI specification.
 * This includes basic HTTP calls and handling of Bearer Token authentication.
 */

const fetch = require('node-fetch'); // uses node-fetch for HTTP calls Node.js

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
     * @param {string[]} [params.parent] - Limit selection to the submitted ID.
     * @param {string[]} [params.schoolUnitCode] - ... the school units matching the submitted school unit code.
     * @param {string[]} [params.organisationCode] - ... the organisation elements that matches the submitted code.
     * @param {string} [params.municipalityCode] - ... the elements that matches the submitted municipality code.
     * @param {string[]} [params.type] - ... to the chosen type (e.g. "Huvudman", "Skolenhet").
     * @param {string[]} [params.schoolTypes] - ... to elements with the given school type.
     * @param {string} [params.startDateOnOrBefore] - ... to elements that has a value before or on the given date (RFC 3339 format).
     * @param {string} [params.startDateOnOrAfter] - ... to elements that has a value on or after the given date (RFC 3339 format).
     * @param {string} [params.endDateOnOrBefore] - ... to elements that have an end date before or on the given date (RFC 3339 format).
     * @param {string} [params.endDateOnOrAfter] - ... to elements that have an end date on or after the given date (RFC 3339 format).
     * @param {string} [params.metaCreatedBefore] - ... to elements created on or before the given date (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - ... to elements created after this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - ... to elements that have been modified before this timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - ... to elements have been modified after this timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Return `displayName` for all refered objects.
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
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fel vid POST-anrop till ${url.toString()}:`, error);
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
     * @param {Object} [params={}] - Filterparametrar.
     * @param {string[]} [params.nameContains] - Begränsa urvalet till de personer vars namn innehåller något av parameterns värden.
     * @param {string} [params.civicNo] - Begränsa urvalet till den person vars civicNo matchar parameterns värde.
     * @param {string} [params.eduPersonPrincipalName] - Begränsa urvalet till den person vars eduPersonPrincipalNames matchar parameterns värde.
     * @param {string} [params.identifierValue] - Begränsa urvalet till den person vilka har ett värde i `externalIdentifiers.value` som matchar parameterns värde.
     * @param {string} [params.identifierContext] - Begränsa urvalet till den person vilka har ett värde i `externalIdentifiers.context` som matchar parameterns värde.
     * @param {string} [params.relationshipEntityType] - Begränsa urvalet till de personer som har en denna typ av relation till andra entiteter.
     * @param {string} [params.relationshipOrganisation] - Begränsa urvalet till de personer som har en relation till angivet organisationselement.
     * @param {string} [params.relationshipStartDateOnOrBefore] - Begränsa urvalet av personer till de som har relationer med startDate innan eller på det angivna datumet (RFC 3339-format).
     * @param {string} [params.relationshipStartDateOnOrAfter] - Begränsa urvalet av personer till de som har relationer med startDate efter eller på det angivna datumet (RFC 3339-format).
     * @param {string} [params.relationshipEndDateOnOrBefore] - Begränsa urvalet av personer till de som har relationer med endDate innan eller på det angivna datumet (RFC 3339-format).
     * @param {string} [params.relationshipEndDateOnOrAfter] - Begränsa urvalet av personer till de som har relationer med endDate efter eller på det angivna datumet (RFC 3339-format).
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
     * Hämta många personer baserat på en lista av ID:n eller personnummer.
     * @param {Object} body - Request-body.
     * @param {string[]} [body.ids] - Lista med person-ID:n.
     * @param {string[]} [body.civicNos] - Lista med personnummer.
     * @param {string[]} [expand] - Beskriver om expanderade data ska hämtas.
     * @param {boolean} [expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @returns {Promise<Object>} - En lista med personer.
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
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fel vid POST-anrop till ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Hämta en person baserat på person-ID.
     * @param {string} id - ID för personen.
     * @param {string[]} [expand] - Beskriver om expanderade data ska hämtas.
     * @param {boolean} [expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @returns {Promise<Object>} - Personobjektet.
     */
    async getPersonById(id, expand = [], expandReferenceNames = false) {
        const params = { expand, expandReferenceNames };
        return this._get(`/persons/${id}`, params);
    }

    // --- Subscriptions (Webhooks) Endpoints ---

    /**
     * Hämta en lista av prenumerationer.
     * @param {Object} [params={}] - Filterparametrar.
     * @param {number} [params.limit] - Antal poster som ska visas i resultatet.
     * @param {string} [params.pageToken] - Ett opakt värde som servern givit som svar på en tidigare ställd fråga.
     * @returns {Promise<Object>} - En lista med prenumerationer.
     */
    async getSubscriptions(params = {}) {
        return this._get('/subscriptions', params);
    }

    /**
     * Skapa en prenumeration.
     * @param {Object} body - Request-body.
     * @param {string} body.name - Ett beskrivande namn på webhook:en.
     * @param {string} body.target - URL:en som webhook:en ska posta till.
     * @param {Object[]} body.resourceTypes - Lista med resurstyper att prenumerera på.
     * @param {string} body.resourceTypes[].resource - Resurstyp (t.ex. "Organisation", "Person").
     * @returns {Promise<Object>} - Det skapade prenumerationsobjektet.
     */
    async createSubscription(body) {
        return this._post('/subscriptions', body);
    }

    /**
     * Ta bort en prenumeration.
     * @param {string} id - ID för prenumerationen som ska tas bort.
     * @returns {Promise<void>}
     */
    async deleteSubscription(id) {
        return this._delete(`/subscriptions/${id}`);
    }

    /**
     * Hämta prenumeration baserat på ID.
     * @param {string} id - ID för prenumerationen.
     * @returns {Promise<Object>} - Prenumerationsobjektet.
     */
    async getSubscriptionById(id) {
        return this._get(`/subscriptions/${id}`);
    }

    /**
     * Uppdatera expire time på prenumerationen baserat på ID.
     * @param {string} id - ID för prenumerationen som ska uppdateras.
     * @param {Object} body - Request-body (t.ex. { expires: "2025-12-31T23:59:59Z" }).
     * @returns {Promise<Object>} - Det uppdaterade prenumerationsobjektet.
     */
    async updateSubscription(id, body) {
        return this._patch(`/subscriptions/${id}`, body);
    }

    // --- Övriga ändpunkter kan läggas till här på liknande sätt ---
    // Exempel: getPlacements, createAttendance, getGrades, etc.
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