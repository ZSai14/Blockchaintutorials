'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AddressesTable extends Contract {

    async InitLedger(ctx) {
        const docs = [
            {
                // ID: 'asset6',
                // Color: 'white',
                // Size: 15,
                // Owner: 'Michel',
                // AppraisedValue: 800,
                addressID: "1111",
                address: "Mall",
                block: "SBI Bank",
                village: "Old Brahmanapally",
                state: "Telangana",
                district: "Ranga Reddy",
                taluk: "Kalwakurthy",
                city: "Hyderabad",
                pincode: "509327",
                userID: "HAR",
            },
        ];

        for (const doc of docs) {
            // doc.docType = 'doc';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(doc.addressID, Buffer.from(stringify(sortKeysRecursive(doc))));
        }
    }

    // CreateDoc issues a new doc to the world state with given details.
    async CreateDoc(ctx, addressID, address, block, village, state, district, taluk, city, pincode, userID) {
        const exists = await this.DocExists(ctx, addressID);
        if (exists) {
            throw new Error(`The doc ${addressID} already exists`);
        }

        const doc = {
            addressID: addressID,
            address,
            block,
            village,
            state,
            district,
            taluk,
            city,
            pincode,
            userID,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(addressID, Buffer.from(stringify(sortKeysRecursive(doc))));
        return JSON.stringify(doc);
    }

    // ReadDoc returns the doc stored in the world state with given id.
    async ReadDoc(ctx, addressID) {
        const docJSON = await ctx.stub.getState(addressID); // get the doc from chaincode state
        if (!docJSON || docJSON.length === 0) {
            throw new Error(`The doc ${addressID} does not exist`);
        }
        return docJSON.toString();
    }

    // UpdateDoc updates an existing doc in the world state with provided parameters.
    async UpdateDoc(ctx,  addressID, address, block, village, state, district, taluk, city, pincode, userID ) {
        const exists = await this.DocExists(ctx, addressID);
        if (!exists) {
            throw new Error(`The doc ${addressID} does not exist`);
        }

        // overwriting original doc with new doc
        const updatedDoc = {
            addressID: addressID,
            address,
            block,
            village,
            state,
            district,
            taluk,
            city,
            pincode,
            userID,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(addressID, Buffer.from(stringify(sortKeysRecursive(updatedDoc))));
    }

    // DeleteDoc deletes an given doc from the world state.
    async DeleteDoc(ctx, addressID) {
        const exists = await this.DocExists(ctx, addressID);
        if (!exists) {
            throw new Error(`The doc ${addressID} does not exist`);
        }
        return ctx.stub.deleteState(addressID);
    }

    // DocExists returns true when doc with given addressID exists in world state.
    async DocExists(ctx, addressID) {
        const docJSON = await ctx.stub.getState(addressID);
        return docJSON && docJSON.length > 0;
    }

    // GetAllDocs returns all docs found in the world state.
    async GetAllDocs(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all docs in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AddressesTable;
