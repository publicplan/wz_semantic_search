const fs = require("node:fs");
const dotenv = require("dotenv");

const {
    createVectors,
    clearIndex
} = require("./lib/helper");

dotenv.config();

const base64Credentials = Buffer.from(`${process.env.ELASTIC_USER}:${process.env.ELASTIC_PASSWORD}`).toString('base64');

async function readData() {
    try {
        let data = await fs.promises.readFile("./raw_data/wz_keys.json", "utf8");


        if (data) {
            console.log("got data");


            const json = JSON.parse(data);

            const newJson = [];

            // clear data from index
            await clearIndex("wz-api");

            let count = 0;
            console.log(json.length);

            for (const wz of json) {

                const vectors = await createVectors([wz.name, wz.division_name, wz.group_name, wz.class_name, wz.explanation]);
                if (vectors.length > 0) {
                    const name_vector = vectors[0].embedding;
                    const division_name_vector = vectors[1].embedding;
                    const group_name_vector = vectors[2].embedding;
                    const class_name_vector = vectors[3].embedding;
                    const explanation_vector = vectors[4].embedding;

                    const updatedWZObj = {
                        code: wz.code,
                        name: wz.name,
                        name_vector,
                        division_name: wz.division_name,
                        division_name_vector,
                        group_name: wz.group_name,
                        group_name_vector,
                        class_name: wz.class_name,
                        class_name_vector,
                        explanation: wz.explanation,
                        explanation_vector,
                        exclusions: wz.exclusions
                    }
                    await sendToElastic(updatedWZObj);
                }

                count++;
                console.log(count);


            }

        }
    } catch (err) {
        console.error(err);
    }
}

async function sendToElastic(obj) {
    const response = await fetch(`${process.env.ELASTIC_URL}/wz-api/_doc`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Basic ${base64Credentials}`,
        },
        body: JSON.stringify(obj),
    });

    if (response.error) {
        console.error(response.error);
    }
    if (response.ok) {
        const json = await response.json();
        return json.data;
    } else {
        console.log(response.statusText, await response.json());
        return response.statusText;
    }
}



readData();