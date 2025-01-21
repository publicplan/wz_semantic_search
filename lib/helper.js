const dotenv = require("dotenv");
dotenv.config();
const base64Credentials = Buffer.from(`${process.env.ELASTIC_USER}:${process.env.ELASTIC_PASSWORD}`).toString('base64');

async function createVectors(text) {
    const json = {
        input: text,
        model: process.env.EMBEDDING_MODEL,
    };

    const response = await fetch(`${process.env.EMBEDDING_URL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(json),
    });

    if (response.error) {
        console.error(response.error);
    }
    if (response.ok) {
        const json = await response.json();
        //console.log(text, json.data);
        return json.data;
    } else {
        console.log(response.statusText, await response.json());
        return response.statusText;
    }
}

async function clearIndex(indexName) {

    const json = {
        query: {
            match_all: {}
        }
    };

    const response = await fetch(`${process.env.ELASTIC_URL}/${indexName}/_delete_by_query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Basic ${base64Credentials}`,
        },
        body: JSON.stringify(json),
    });
    return await response.json();
}

module.exports = {
    createVectors,
    clearIndex
}