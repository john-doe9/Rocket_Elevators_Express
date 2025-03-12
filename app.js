"use strict";

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "config.env") }); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3003;
const ENVIRONMENT = process.env.ENVIRONMENT || "local";
const API_URL = process.env.AGENTS_API_URL || "http://99.79.77.144:3000/api/agents";

app.use(express.json());

//  GET - '/hello' (Proof of concept)
app.get("/hello", (req, res) => {
    res.send("Hello World!");
});

//  GET - '/status' (Returns port & environment from config.env)
app.get("/status", (req, res) => {
    res.json({
        message: ` Server is running on port ${PORT} in ${ENVIRONMENT} mode`
    });
});

//  GET - '/error' (Simulates an error response)
app.get("/error", (req, res) => {
    res.status(500).json({
        error: "Internal Server Error",
        message: "This is a simulated error for testing."
    });
});

//  GET - '/email-list' (Fetch agent emails from API)
app.get("/email-list", async (req, res) => {
    try {
        const response = await axios.get(API_URL);
        const agents = response.data;

        if (!Array.isArray(agents)) {
            throw new Error("Invalid data format from API");
        }

        const emailList = agents.map(agent => agent.email);

        res.json({
            total_agents: emailList.length,
            emails: emailList
        });

    } catch (error) {
        console.error("Error fetching agent emails:", error.message);
        res.status(500).json({ error: "Failed to fetch agent emails" });
    }
});

//  GET - '/region-avg' (Calculate average rating & fee for a region)
app.get("/region-avg", async (req, res) => {
    const { region } = req.query;
    if (!region) {
        return res.status(400).json({ error: "Region query parameter is required." });
    }

    try {
        const response = await axios.get(API_URL);
        const agents = response.data.filter(agent => agent.region.toLowerCase() === region.toLowerCase());

        if (agents.length === 0) {
            return res.status(404).json({ error: `No agents found in the ${region} region.` });
        }

        const avgRating = agents.reduce((sum, agent) => sum + agent.rating, 0) / agents.length;
        const avgFee = agents.reduce((sum, agent) => sum + agent.fee, 0) / agents.length;

        res.json({
            region: region,
            total_agents: agents.length,
            average_rating: avgRating.toFixed(2),
            average_fee: avgFee.toFixed(2),
            agents: agents.map(agent => ({
                first_name: agent.first_name,
                last_name: agent.last_name,
                rating: agent.rating,
                fee: agent.fee
            }))
        });

    } catch (error) {
        console.error("Error fetching region data:", error.message);
        res.status(500).json({ error: "Failed to calculate region average." });
    }
});

//  POST - '/contact-us' (Submit contact form)
app.post("/contact-us", (req, res) => {
    const { first_name, last_name, message } = req.body;

    if (!first_name || !last_name || !message) {
        return res.status(400).json({ error: "Missing required parameter." });
    }

    res.json({
        message: "✅ Contact request received!",
        contact: { first_name, last_name, message }
    });
});

//  GET - '/calc-residential' (Calculate required elevators & cost for Residential)
app.get("/calc-residential", (req, res) => {
    const { floors, apartments } = req.query;
    if (!floors || !apartments) {
        return res.status(400).json({ error: "Missing required parameters: floors and apartments." });
    }

    const numFloors = parseInt(floors);
    const numApartments = parseInt(apartments);
    const elevatorsRequired = Math.ceil(numApartments / numFloors / 6) * Math.ceil(numFloors / 20);
    const costPerElevator = 10000;
    const totalCost = elevatorsRequired * costPerElevator;

    res.json({
        floors: numFloors,
        apartments: numApartments,
        elevatorsRequired,
        totalCost: `$${totalCost.toFixed(2)}`
    });
});

//  Start the server
app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT} in ${ENVIRONMENT} mode`);
}); 