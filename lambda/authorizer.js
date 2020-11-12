const https = require('https');
const assert = require('assert').strict;

const { ADO_ORG, METHOD, BASIC_USER, BASIC_PASSWORD } = process.env;

const UNAUTHORIZED = new Error('Unauthorized');

function basicAuth(user, password) {
    assert(user === BASIC_USER && password === BASIC_PASSWORD, UNAUTHORIZED);
}

function azureDevOps(user, password) {
    if (user !== 'ADO' || !ADO_ORG) throw UNAUTHORIZED;

    return new Promise((resolve, reject) => https.get(`https://dev.azure.com/${ADO_ORG}/_apis/projects`, {
        headers: {
            Authorization: `Bearer ${password}`,
        },
    }, async (res) => {
        // empty buffer
        for await (const chunk of res) {}
        if (res.statusCode === 200) resolve();
        else reject(UNAUTHORIZED);
    }));
}

exports.handler = async ({ authorizationToken }) => {
    const [type, encoded] = authorizationToken.split(/\s+/, 2);
    const [user, password] = Buffer.from(encoded, 'base64').toString().split(':', 2);

    if (METHOD === 'AZURE_DEVOPS') {
        await azureDevOps(user, password);
    } else if (METHOD === 'BASIC') {
        await basicAuth(user, password);
    } else throw UNAUTHORIZED;

    return {
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Resource: '*',
                Action: 'execute-api:Invoke',
            }]
        },
    };
};
