require("dotenv").config();
const axios = require("axios");

async function testFirmao() {
    try {
        console.log("Łączenie z Firmao...");

        const response = await axios.get(
            `${process.env.FIRMAO_API_URL}/tasks`,
            {
                auth: {
                    username: process.env.FIRMAO_EMAIL,
                    password: process.env.FIRMAO_PASSWORD
                }
            }
        );

        console.log("Połączenie działa!");
        console.log("Status HTTP:", response.status);

        console.log(
            JSON.stringify(response.data, null, 2)
        );

    } catch (error) {
        console.error("BŁĄD API FIRMAO:");

        if (error.response) {
            console.error("HTTP:", error.response.status);
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testFirmao();