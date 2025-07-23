# **SS12000 Node.js client package**

This is a Node.js client package (or library if you will) that aims to simplify the integration with a server running a SS12000-compatible API. It is based on the OpenAPI 3 specification basically and it is really not that complicated to be honest. The package handles HTTP  calls and Bearer Token authentication, and is designed to provide a structured method for integrating with all of the defined endpoints of the standard. 

### **Important**

The SS12000 does not require the server to support all of the endpoints. You need to actually look at the server documentation to see which endpoints that are actually available with each service. Adding some sort of discovery service is beyond the scope of this small library in my humble opinion.

## **Content**

- [**SS12000 Node.js client package**](#ss12000-nodejs-client-package)
    - [**Important**](#important)
  - [**Content**](#content)
  - [**Installation**](#installation)
  - [**Usage**](#usage)
    - [**Initiate the client**](#initiate-the-client)
    - [**Fetch Organisations**](#fetch-organisations)
    - [**Fetch Persons**](#fetch-persons)
    - [**Fetch ...**](#fetch-)
    - [**Webhooks for Subscriptions**](#webhooks-for-subscriptions)
  - [**API-referens**](#api-referens)
  - [**Webhooks receiver (example)**](#webhooks-receiver-example)
  - [**Contribute**](#contribute)
  - [**License**](#license)

## **Installation**

1. **Spara klienten:** Spara koden från ss12000-client.js i din projektkatalog.  
2. **Installera beroenden:** Detta bibliotek använder node-fetch för att göra HTTP-anrop. Om du planerar att använda webhook-mottagarexemplet behöver du även express och body-parser.  
   npm install node-fetch express body-parser

## **Usage**

### **Initiate the client**

To start using the client, import it and create an instance of the client inputing the API base url and your JWT Bearer Token.  

```
const SS12000Client = require('./ss12000-client');

const baseUrl = 'http://some.server.com/v2.0'; // Base URL goes here  
const authToken = 'JWT_TOKEN_HERE'; // Insert actual JWT token here

const client = new SS12000Client(baseUrl, authToken);
```
### **Fetch Organisations**

You can fetch a list of organisations or a specific organisation using its ID.  
```
async function getOrganisationData() {  
    try {  
        console.log('fetching organisations...');  
        const organisations \= await client.getOrganisations({ limit: 5 });  
        console.log('Found organisations:', JSON.stringify(organisations, null, 2));

        if (organisations.data && organisations.data.length \> 0\) {  
            const firstOrgId \= organisations.data\[0\].id;  
            console.log(\`Hämtar organisation med ID: ${firstOrgId}...\`);  
            const organisation \= await client.getOrganisationById(firstOrgId, true); // expandReferenceNames \= true  
            console.log('Hämtad organisation:', JSON.stringify(organisation, null, 2));  
        }  
    } catch (error) {  
        console.error('Error when fetching organisations:', error.message);  
    }  
}

// getOrganisationData(); // Avkommentera för att köra
```
### **Fetch Persons**

In the same manner you can fetch persons and expanded related data, e.g. duties.  
```
async function getPersonData() {  
    try {  
        console.log('Fetching persons...');  
        const persons = await client.getPersons({ limit: 5, expand: ['duties'] }); // Expand duties  
        console.log('Fetched persons:', JSON.stringify(persons, null, 2));

        if (persons.data && persons.data.length > 0) {  
            const firstPersonId = persons.data[0].id;  
            console.log(`Fetched person with ID: ${firstPersonId}...`);  
            const person = await client.getPersonById(firstPersonId, ['duties', 'responsibleFor'], true);  
            console.log('Fetched person:', JSON.stringify(person, null, 2));  
        }  
    } catch (error) {  
        console.error('Error when fetching persons:', error.message);  
    }  
}

// getPersonData(); // Avkommentera för att köra
```
### **Fetch ...**

Check the API reference below to see all available nodes. 

### **Webhooks for Subscriptions**

Klienten tillhandahåller metoder för att hantera prenumerationer (webhooks).
```
async function manageSubscriptions() {  
    try {  
        console.log('Hämtar prenumerationer...');  
        const subscriptions \= await client.getSubscriptions();  
        console.log('Hämtade prenumerationer:', JSON.stringify(subscriptions, null, 2));

        // Exempel: Skapa en prenumeration (kräver en publikt tillgänglig webhook-URL)  
        /\*  
        console.log('\\nSkapar en prenumeration...');  
        const newSubscription \= await client.createSubscription({  
            name: 'Min Testprenumeration',  
            target: 'http://your-public-webhook-url.com/ss12000-webhook', // Ersätt med din publika URL  
            resourceTypes: \[{ resource: 'Person' }, { resource: 'Activity' }\]  
        });  
        console.log('Skapad prenumeration:', JSON.stringify(newSubscription, null, 2));  
        \*/

        // Exempel: Ta bort en prenumeration  
        /\*  
        if (subscriptions.data && subscriptions.data.length \> 0\) {  
            const subToDelete \= subscriptions.data\[0\].id;  
            console.log(\`\\nTar bort prenumeration med ID: ${subToDelete}...\`);  
            await client.deleteSubscription(subToDelete);  
            console.log('Prenumeration borttagen framgångsrikt.');  
        }  
        \*/  
    } catch (error) {  
        console.error('Fel vid hantering av prenumerationer:', error.message);  
    }  
}

// manageSubscriptions(); // Avkommentera för att köra
```

## **API-referens**

SS12000Client is designed to expose methods for all SS12000 API endpoints. Here is a list of the primary endpoints that are defined in the OpenAPI specification:

* /organisations  
* /organisations/{id}  
* /organisations/lookup  
* /persons  
* /persons/{id}  
* /persons/lookup  
* /placements  
* /placements/{id}  
* /placements/lookup  
* /duties  
* /duties/{id}  
* /duties/lookup  
* /groups  
* /groups/{id}  
* /groups/lookup  
* /programmes  
* /programmes/{id}  
* /programmes/lookup  
* /studyplans  
* /studyplans/{id}  
* /studyplans/lookup  
* /syllabuses  
* /syllabuses/{id}  
* /syllabuses/lookup  
* /schoolUnitOfferings  
* /schoolUnitOfferings/{id}  
* /schoolUnitOfferings/lookup  
* /activities  
* /activities/{id}  
* /activities/lookup  
* /calendarEvents  
* /calendarEvents/{id}  
* /calendarEvents/lookup  
* /attendances  
* /attendances/{id}  
* /attendances/lookup  
* /attendanceEvents  
* /attendanceEvents/{id}  
* /attendanceEvents/lookup  
* /attendanceSchedules  
* /attendanceSchedules/{id}  
* /attendanceSchedules/lookup  
* /grades  
* /grades/{id}  
* /grades/lookup  
* /aggregatedAttendance  
* /aggregatedAttendance/{id}  
* /aggregatedAttendance/lookup  
* /resources  
* /resources/{id}  
* /resources/lookup  
* /rooms  
* /rooms/{id}  
* /rooms/lookup  
* /subscriptions  
* /subscriptions/{id}  
* /deletedEntities  
* /log  
* /statistics

Each method accepts the parameters that are equivalent to the API query parameters and request bodies, all according to the OpenAPI specification. Detailed information on available parameters is in the JSDoc comments in the main file ss12000-client.js.

## **Webhooks receiver (example)**

A separate Express.js server can be used to receive notifications from the SS12000 API. This is just an example and is not part of the client library. It just shows how you could implement a receiver server for the webhooks. The code below is not production ready code, it's just a thought experiment that will point you in a direction toward a simple solution. 

```
webhook-server.js  
const express = require('express');  
const bodyParser = require('body-parser');

const webhookApp = express();  
const webhookPort = 3001; // Pick a port

webhookApp.use(bodyParser.json());

webhookApp.post('/ss12000-webhook', (req, res) => {  
    console.log('Received a webhook from SS12000!');  
    console.log('Headers:', req.headers);  
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Any logic that reacts to the webhook goes below.  
    // E.g. trigger an update call to a specific node, etc.

    if (req.body && req.body.modifiedEntites) {  
        req.body.modifiedEntites.forEach(resourceType => {  
            console.log(`Changes for resource type: ${resourceType}`);  
            // Here you call SS12000Client to fetch the updated data   
            // E.g.: if (resourceType === 'Person') { client.getPersons(...); }  
        });  
    }

    if (req.body && req.body.deletedEntities) {  
        console.log('There are new removed entites to fetch from /deletedEntities.');  
        // Anropa client.getDeletedEntities(...)  
    }

    res.status(200).send('Webhook received successfully!');  
});

webhookApp.listen(webhookPort, () \=\> {  
    console.log(\`SS12000 Webhook receiver listening to http://localhost:${webhookPort}\`);  
});  
```

Make sure the server is exposed to the SS12000 server so that it can actually send the webhooks to you. 

## **Contribute**

Contributions are welcome! If you want to add, improve, optimize or just change things just send in a pull request and I will have a look. Found a bug and don't know how to fix it? Create an issue!

## **License**

This project is licensed under the MIT License.