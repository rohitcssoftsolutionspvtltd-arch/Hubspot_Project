require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 7654;

// Setup Pug Template Engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Currently using Contacts to test HubSpot API connection
const CUSTOM_OBJECT_TYPE = "contacts";

// HubSpot API headers
const hubspotHeaders = {
  headers: {
    Authorization: `Bearer ${
      process.env.HUBSPOT_ACCESS_TOKEN
        ? process.env.HUBSPOT_ACCESS_TOKEN.trim()
        : ""
    }`,
    "Content-Type": "application/json",
  },
};

// ======================================================
// GET /
// Get HubSpot Contacts
// ======================================================
app.get("/", async (req, res) => {
  const url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=firstname,lastname,email`;

  try {
    const response = await axios.get(url, hubspotHeaders);

    const records = response.data.results;

    let html = `
      <h1>HubSpot CRM Records</h1>

      <a href="/update-cobj">Add New Record</a>

      <br/>
      <br/>

      <table border="1" cellpadding="8">
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Last Name / Breed</th>
          <th>Email</th>
        </tr>
    `;

    records.forEach((item) => {
      html += `
        <tr>
          <td>${item.id}</td>
          <td>${item.properties.firstname || ""}</td>
          <td>${item.properties.lastname || ""}</td>
          <td>${item.properties.email || ""}</td>
        </tr>
      `;
    });

    html += `
      </table>
    `;

    res.send(html);
  } catch (error) {
    console.error(
      "Error fetching records:",
      error.response ? error.response.data : error.message,
    );

    res.status(500).send("Error retrieving records from HubSpot.");
  }
});

// ======================================================
// GET /update-cobj
// Display form
// ======================================================
app.get("/update-cobj", (req, res) => {
  res.render("updates");
});

// ======================================================
// POST /update-cobj
// Create a new HubSpot Contact
// ======================================================
app.post("/update-cobj", async (req, res) => {
  try {
    const { name, breed, age } = req.body;

    // Validate required fields
    if (!name || !breed || !age) {
      return res.status(400).send("Name, breed and age are required.");
    }

    const createUrl = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;

    // Create a unique email for the test contact
    const email =
      `${name.toLowerCase().replace(/\s+/g, "")}` +
      `${Math.floor(Math.random() * 1000)}` +
      "@example.com";

    const payload = {
      properties: {
        firstname: name,
        lastname: breed,
        email: email,
      },
    };

    console.log("Creating HubSpot record...");
    console.log("Payload:", payload);

    const response = await axios.post(createUrl, payload, hubspotHeaders);

    console.log("HubSpot response:", response.data);

    res.redirect("/");
  } catch (error) {
    console.error(
      "Error creating record:",
      error.response ? error.response.data : error.message,
    );

    res.status(500).send("Failed to create record in HubSpot.");
  }
});

// ======================================================
// Start Server
// ======================================================
app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
});
