//Imports
const express = require("express");
const dotenv = require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

//Setup App
const app = express();
app.use(express.json());
const supabase = createClient(process.env.SUPAURL, process.env.SUPAKEY);

//Vars
const PORT = process.env.PORT;

app.post("/addUserPlaytime", async (req, res) => {
  try {
    if (!req.body.id || !req.body.time || !req.body.key) {
      return res.send("Invalid data.");
    } else {
      if (req.body.key != process.env.SET_KEY) {
        return res.status(401).send("Invalid API key");
      } else {
        const { data: oldData, error: olderror } = await supabase
          .from("playtime")
          .select()
          .eq("id", parseInt(req.body.id));
        if (oldData && oldData.length != 0) {
          const { data, error } = await supabase.from("playtime").upsert(
            [
              {
                id: parseInt(req.body.id),
                playtime: parseInt(req.body.time) + oldData[0].playtime,
              },
            ],
            { onConflict: "id" }
          ); // 'id' is the column used to check conflicts

          if (error) {
            console.error("Error upserting data:", error);
            return res.status(500).send("Error upserting data");
          }

          console.log(data);
          res.send(true);
        
        }else{
            const { data, error } = await supabase.from("playtime").upsert(
                [
                  {
                    id: parseInt(req.body.id),
                    playtime: parseInt(req.body.time),
                  },
                ],
                { onConflict: "id" }
              ); s
    
              if (error) {
                console.error("Error upserting data:", error);
                return res.status(500).send("Error upserting data");
              }
    
              console.log(data);
              res.send(true);
        }
      }
    }
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(400).send("Invalid JSON data");
  }
});

app.get("/getUserPlaytime", async (req, res) => {
  try {
    if (!req.body.id || !req.body.key) {
      return res.status(400).send("Invalid data.");
    }
    const userId = parseInt(req.body.id);

    if (req.body.key != process.env.GET_KEY) {
      return res.status(401).send("Invalid API key");
    }

    const { data, error } = await supabase
      .from("playtime")
      .select()
      .eq("id", userId);

    if (error) {
      console.error("Error fetching data:", error.message);
      return res.send({
        result: false,
      });
    }

    if (!data || data.length === 0) {
      return res.send({
        result: false,
      });
    }
    const playtime = data[0].playtime;

    return res.send({
      data: playtime >= 1200,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(400).send("Invalid JSON data");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
