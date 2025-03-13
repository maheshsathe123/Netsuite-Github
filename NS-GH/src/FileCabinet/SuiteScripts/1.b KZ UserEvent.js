/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/https', 'N/log', 'N/record'], function(https, log, record) {

    function afterSubmit(context) {
        var operationType;
        var customerData = {};

        if (context.type === context.UserEventType.CREATE) {
            operationType = 'POST';
        } else if (context.type === context.UserEventType.EDIT) {
            operationType = 'PATCH';
        } else if (context.type === context.UserEventType.DELETE) {
            operationType = 'DELETE';
        }

        // If DELETE operation, only send the customer ID and skip isSyncInitiated check
        if (operationType === 'DELETE') {
            customerData = { id: context.oldRecord.id }; // Use oldRecord for DELETE to get the ID
        } else {
            // For CREATE and EDIT operations, retrieve other field values
            var customerRecord = context.newRecord;

            // Check if sync initiation is flagged
            var isSyncInitiated = customerRecord.getValue('custentitycustentity_is_sync_initiated');
            if (!isSyncInitiated) {
                log.debug('Sync Not Initiated', 'isSyncInitiated is not checked. Skipping Salesforce sync.');
                return;
            }

            // Prepare customer data for Salesforce
            customerData = {
                id: customerRecord.id,
                name: customerRecord.getValue('companyname'),
                email: customerRecord.getValue('email'),
                phone: customerRecord.getValue('phone'),
                altphone: customerRecord.getValue('altphone'),
                fax: customerRecord.getValue('fax'),
                url: customerRecord.getValue('url'),
                custentitycustentity_is_sync_initiated: isSyncInitiated
            };
        }

        // Salesforce instance and endpoint setup
        var instanceUrl = 'https://livestrongtechnologies2-dev-ed.develop.my.salesforce.com';
        var endpointUrl = instanceUrl + '/services/apexrest/netsuiteCustomer/' + customerData.id;

        try {
            var response = sendRequestToSalesforce(endpointUrl, operationType, customerData);
            log.debug('Salesforce Response', response.body);
        } catch (e) {
            log.error('Error Sending Data to Salesforce', e.message);
        }
    }

    function sendRequestToSalesforce(endpointUrl, operationType, customerData) {
        // Retrieve or refresh access token
        var accessToken = getAccessToken();
        var response = performHttpCall(endpointUrl, operationType, accessToken, customerData);

        // Handle access token expiration and retry
        if (response.code === 401) {
            log.debug('Access Token Expired', 'Refreshing access token.');
            accessToken = refreshSalesforceToken();

            if (accessToken) {
                response = performHttpCall(endpointUrl, operationType, accessToken, customerData);
            }
        }
        return response;
    }

    function performHttpCall(endpointUrl, operationType, accessToken, customerData) {
        // Set HTTP options with authorization headers
        var options = {
            url: endpointUrl,
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        };

        // Determine which HTTP call to make based on the operation type
        if (operationType === 'DELETE') {
            return https.delete(options);
        } else {
            // For "PATCH" operations, we use POST with an additional header
            if (operationType === 'PATCH') {
                options.headers['X-HTTP-Method-Override'] = 'PATCH';
            }
            return https.post(options); // Use POST for both CREATE and PATCH
        }
    }

    function getAccessToken() {
        var tokenRecordId = '1'; // Update with the actual record ID for the token
        var tokenRecord = record.load({
            type: 'customrecordcustomrecord_salesforce_oaut',
            id: tokenRecordId
        });

        var accessToken = tokenRecord.getValue('custrecordcustrecord_access_token');
        if (!accessToken) {
            accessToken = refreshSalesforceToken();
        }
        return accessToken;
    }

    function refreshSalesforceToken() {
        var tokenRecordId = '1'; // Update with the actual record ID
        var tokenRecord = record.load({
            type: 'customrecordcustomrecord_salesforce_oaut',
            id: tokenRecordId
        });

        var refreshToken = tokenRecord.getValue('custrecordcustrecord_refresh_token');

        try {
            var tokenResponse = https.post({
                url: 'https://login.salesforce.com/services/oauth2/token',
                body: {
                    'grant_type': 'refresh_token',
                    'client_id': '3MVG9k02hQhyUgQDqrJ44C2PVW8MB1iI9McNDxE4SW_vMjKM9Z3kIj978XnoFbJvYStydVjidk8KpmFaZ_Jwt',
                    'client_secret': '782B4DDF5E7835C165AE1F2BD6F443BF75597727EA7D5819501E1EBE23EDED27',
                    'refresh_token': refreshToken
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            var responseBody = JSON.parse(tokenResponse.body);

            if (responseBody.access_token) {
                // Update the access token record
                record.submitFields({
                    type: 'customrecordcustomrecord_salesforce_oaut',
                    id: tokenRecordId,
                    values: {
                        custrecordcustrecord_access_token: responseBody.access_token
                    }
                });
                log.debug('Access Token Refreshed', 'New access token stored successfully.');
                return responseBody.access_token;
            } else {
                log.error('Token Refresh Failed', 'No access token found in the response.');
            }
        } catch (e) {
            log.error('Error Refreshing Access Token', e.message);
        }
        return null;
    }

    return {
        afterSubmit: afterSubmit
    };
});
