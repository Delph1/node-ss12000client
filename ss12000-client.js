// ss12000-client.js
/**
 * @file Node.js-klientbibliotek för SS12000 API:et.
 * Detta bibliotek tillhandahåller funktioner för att interagera med SS12000 API:et
 * baserat på den tillhandahållna OpenAPI-specifikationen.
 * Inkluderar grundläggande HTTP-anrop och hantering av Bearer Token-autentisering.
 */

const fetch = require('node-fetch'); // Använd node-fetch för HTTP-anrop i Node.js

/**
 * SS12000 API Klient
 * @class
 * @param {string} baseUrl - Bas-URL för SS12000 API:et (t.ex. "http://some.server.se/v2.0").
 * @param {string} authToken - JWT Bearer Token för autentisering.
 */
class SS12000Client {
    constructor(baseUrl, authToken) {
        if (!baseUrl) {
            throw new Error('Base URL är obligatorisk för SS12000Client.');
        }
        if (!authToken) {
            console.warn('Varning: Autentiseringstoken saknas. Anrop kan misslyckas om API:et kräver autentisering.');
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
     * Utför ett generiskt GET-anrop mot API:et.
     * @private
     * @param {string} path - API-sökvägen (t.ex. "/organisations").
     * @param {Object} [params={}] - Query-parametrar.
     * @returns {Promise<Object>} - Svaret från API:et.
     * @throws {Error} Om anropet misslyckas.
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
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fel vid GET-anrop till ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Utför ett generiskt POST-anrop mot API:et.
     * @private
     * @param {string} path - API-sökvägen (t.ex. "/organisations/lookup").
     * @param {Object} body - Request-body.
     * @returns {Promise<Object>} - Svaret från API:et.
     * @throws {Error} Om anropet misslyckas.
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
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fel vid POST-anrop till ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Utför ett generiskt DELETE-anrop mot API:et.
     * @private
     * @param {string} path - API-sökvägen (t.ex. "/attendances/{id}").
     * @returns {Promise<void>} - Ingen retur vid framgång.
     * @throws {Error} Om anropet misslyckas.
     */
    async _delete(path) {
        const url = new URL(`${this.baseUrl}${path}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: this.headers,
            });

            if (response.status === 204) {
                return; // 204 No Content indikerar framgångsrik borttagning
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
        } catch (error) {
            console.error(`Fel vid DELETE-anrop till ${url.toString()}:`, error);
            throw error;
        }
    }

    /**
     * Utför ett generiskt PATCH-anrop mot API:et.
     * @private
     * @param {string} path - API-sökvägen (t.ex. "/subscriptions/{id}").
     * @param {Object} body - Request-body.
     * @returns {Promise<Object>} - Svaret från API:et.
     * @throws {Error} Om anropet misslyckas.
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
                throw new Error(`API-anrop misslyckades: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fel vid PATCH-anrop till ${url.toString()}:`, error);
            throw error;
        }
    }

    // --- Organisation Endpoints ---

    /**
     * Hämta en lista med organisationer.
     * @param {Object} [params={}] - Filterparametrar.
     * @param {string[]} [params.parent] - Begränsa urvalet till utpekade organisations-ID:n.
     * @param {string[]} [params.schoolUnitCode] - Begränsa urvalet till de skolenheter som har den angivna Skolenhetskoden.
     * @param {string[]} [params.organisationCode] - Begränsa urvalet till de organisationselement som har den angivna koden.
     * @param {string} [params.municipalityCode] - Begränsa urvalet till de organisationselement som har angiven kommunkod.
     * @param {string[]} [params.type] - Begränsa urvalet till utpekade typ (t.ex. "Huvudman", "Skolenhet").
     * @param {string[]} [params.schoolTypes] - Begränsa urvalet till de organisationselement som har den angivna skolformen.
     * @param {string} [params.startDateOnOrBefore] - Begränsa urvalet till organisationselement som har ett startDate värde innan eller på det angivna datumet (RFC 3339-format).
     * @param {string} [params.startDateOnOrAfter] - Begränsa urvalet till organisationselement som har ett startDate värde på eller efter det angivna datumet (RFC 3339-format).
     * @param {string} [params.endDateOnOrBefore] - Begränsa urvalet till organisationselement som har ett endDate värde innan eller på det angivna datumet (RFC 3339-format).
     * @param {string} [params.endDateOnOrAfter] - Begränsa urvalet till organisationselement som har ett endDate värde på eller efter det angivna datumet (RFC 3339-format).
     * @param {string} [params.metaCreatedBefore] - Endast poster skapade på eller före detta timestamp (RFC 3339 format).
     * @param {string} [params.metaCreatedAfter] - Endast poster skapade efter detta timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedBefore] - Endast poster modifierade på eller före detta timestamp (RFC 3339 format).
     * @param {string} [params.metaModifiedAfter] - Endast poster modifierade efter detta timestamp (RFC 3339 format).
     * @param {boolean} [params.expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @param {string} [params.sortkey] - Anger hur resultatet ska sorteras (t.ex. "ModifiedDesc", "DisplayNameAsc").
     * @param {number} [params.limit] - Antal poster som ska visas i resultatet.
     * @param {string} [params.pageToken] - Ett opakt värde som servern givit som svar på en tidigare ställd fråga.
     * @returns {Promise<Object>} - En lista med organisationer.
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
     * Hämta många organisationer baserat på en lista av ID:n.
     * @param {Object} body - Request-body.
     * @param {string[]} [body.ids] - Lista med organisation-ID:n.
     * @param {string[]} [body.schoolUnitCodes] - Lista med skolenhetskoder.
     * @param {string[]} [body.organisationCodes] - Lista med organisationskoder.
     * @param {boolean} [expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @returns {Promise<Object>} - En lista med organisationer.
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
     * Hämta en organisation baserat på ID.
     * @param {string} id - ID för organisationen.
     * @param {boolean} [expandReferenceNames] - Returnera `displayName` för alla refererade objekt.
     * @returns {Promise<Object>} - Organisationsobjektet.
     */
    async getOrganisationById(id, expandReferenceNames = false) {
        const params = { expandReferenceNames };
        return this._get(`/organisations/${id}`, params);
    }

    // --- Person Endpoints ---

    /**
     * Hämta en lista med personer.
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
