const fs = require('fs');
const Nodehun = require('nodehun');
const {
    createVectors
} = require("./lib/helper");
const express = require('express');
const app = express();

let affixDE = fs.readFileSync('dictionary/de_DE.aff');
let dictionaryDE = fs.readFileSync('dictionary/de_DE.dic');

let affixES = fs.readFileSync('dictionary/es_ES.aff');
let dictionaryES = fs.readFileSync('dictionary/es_ES.dic');

let hunspell = new Nodehun(affixDE, dictionaryDE);

const base64Credentials = Buffer.from(`${process.env.ELASTIC_USER}:${process.env.ELASTIC_PASSWORD}`).toString('base64');

app.use(express.json());

app.get('/search', (req, res) => {
    if (req.query && req.query.lang && req.query.lang == "ES") {
        hunspell = new Nodehun(affixES, dictionaryES);
    } else {
        hunspell = new Nodehun(affixDE, dictionaryDE);
    }
    search(req.query, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});



function correctWord(word) {
    return new Promise((resolve, reject) => {
        const isCorrect = hunspell.spellSync(word);
        if (isCorrect) {
            resolve(word);
        } else {
            const suggestions = hunspell.suggestSync(word);
            if (suggestions.length > 0) {
                resolve(suggestions[0]); // Verwende den Top-Treffer
            } else {
                resolve(word); // Wenn keine Vorschläge gefunden wurden, das Wort unverändert zurückgeben
            }
        }
    });
}

async function correctSentence(sentence) {
    const words = sentence.split(' ');
    const corrections = await Promise.all(words.map(correctWord));
    return corrections.join(' ');
}

async function search(queryStrings, res) {
    try {
        const searchValue = await correctSentence(queryStrings.q);
        const vectorResult = await createVectors([searchValue]);

        let output = [];

        if (vectorResult.length > 0) {
            const vectors = vectorResult[0].embedding;
            const searchResult = await vectorSearch(vectors);
            if (searchResult.hits?.hits?.length > 0) {
                searchResult.hits.hits.forEach(result => {
                    output.push(result._source);
                })
            }
            res.json({
                query: searchValue,
                results: output
            });
        }
    } catch (error) {
        console.error(`Error caught: ${error}`);
    }
}

async function vectorSearch(vec) {

    const json = {
        "_source": {
            "excludes": [
                "name_vector",
                "division_name_vector",
                "group_name_vector",
                "class_name_vector",
                "explanation_vector"
            ]
        },
        "size": 10,
        "query": {
            "script_score": {
                "query": {
                    "match_all": {}
                },
                "script": {
                    "source": "double score = (cosineSimilarity(params.queryVector, 'name_vector') + 1) / 2 + (cosineSimilarity(params.queryVector, 'division_name_vector') + 1) / 2 + (cosineSimilarity(params.queryVector, 'group_name_vector') + 1) / 2 + (cosineSimilarity(params.queryVector, 'class_name_vector') + 1) / 2 + (cosineSimilarity(params.queryVector, 'explanation_vector') + 1) / 2; return score;",
                    "params": {
                        "queryVector": vec
                    }
                }

            }
        }
    }
    const response = await fetch(`${process.env.ELASTIC_URL}/wz-api/_search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Basic ${base64Credentials}`,
        },
        body: JSON.stringify(json),
    });

    if (response.error) {
        console.error(response.error);
    }
    if (response.status == 200) {
        const result = await response.json();

        return result;
    } else {
        console.log(response.statusText, await response.json());
        return response.statusText;
    }
}