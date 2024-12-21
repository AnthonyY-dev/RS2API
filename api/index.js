require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const querystring = require("querystring");

// Initialize Supabase client
const supabase = createClient(process.env.SUPAURL, process.env.SUPAKEY);

module.exports = async (req, res) => {
  const { method, body, url } = req;
  const path = url.split("?")[0]; // Extract the path
  const queryParams = querystring.parse(url.split("?")[1]); // Parse query params for GET requests

  try {
    // Handle the /addUserPlaytime endpoint
    if (method === "POST" && path === "/api/playtime/addUserPlaytime") {
      if (!body.id || !body.time || !body.key) {
        return res.status(400).send("Invalid data.");
      }
      if (body.key !== process.env.SET_KEY) {
        return res.status(401).send("Invalid API key");
      }

      // Check existing playtime
      const { data: oldData, error: oldError } = await supabase
        .from("playtime")
        .select()
        .eq("id", parseInt(body.id));

      if (oldError) {
        console.error("Error fetching existing data:", oldError);
        return res.status(500).send("Error fetching existing data");
      }

      const playtimeToUpdate =
        oldData && oldData.length !== 0
          ? parseInt(body.time) + oldData[0].playtime
          : parseInt(body.time);

      // Upsert playtime data
      const { data, error } = await supabase.from("playtime").upsert(
        [
          {
            id: parseInt(body.id),
            playtime: playtimeToUpdate,
          },
        ],
        { onConflict: "id" }
      );

      if (error) {
        console.error("Error upserting data:", error);
        return res.status(500).send("Error upserting data");
      }

      return res.status(200).send(true);
    }

    // Handle the /getUserPlaytime endpoint
    if (method === "GET" && path === "/api/playtime/getUserPlaytime") {
      const { id, key } = queryParams;

      if (!id || !key) {
        return res.status(400).send("Invalid data.");
      }
      if (key !== process.env.GET_KEY) {
        return res.status(401).send("Invalid API key");
      }

      const userId = parseInt(id);

      // Fetch playtime data
      const { data, error } = await supabase
        .from("playtime")
        .select()
        .eq("id", userId);

      if (error) {
        console.error("Error fetching data:", error);
        return res.status(500).send({
          result: false,
        });
      }

      if (!data || data.length === 0) {
        return res.send({
          result: false,
        });
      }

      const playtime = data[0].playtime;

      return res.status(200).send({
        result: playtime >= 1200,
      });
    }

    // If no valid endpoint matches, return 404
    return res.status(404).send("Endpoint not found");
  } catch (error) {
    console.error("Error processing request:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};
