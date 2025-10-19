import express from "express";
import play from "@iamtraction/play-dl";
import { setTimeout } from "timers/promises";

const app = express();

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    // Get video info first
    const info = await play.video_info(url);
    const title = info.video_details.title.replace(/[^\w\s]/gi, "");

    let stream = null;

    // Retry logic to bypass temporary bot detection
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        stream = await play.stream(url, { quality: 2, discord: true });
        break; // success
      } catch (err) {
        console.warn(`Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 3) await setTimeout(1000); // wait 1 second before retry
        else throw err; // fail after 3 attempts
      }
    }

    // Collect audio chunks
    const chunks = [];
    stream.stream.on("data", (chunk) => chunks.push(chunk));

    stream.stream.on("end", () => {
      const audioBuffer = Buffer.concat(chunks);
      res.json({
        title: info.video_details.title,
        lengthSeconds: info.video_details.durationInSec,
        audio: audioBuffer.toString("base64") // Lua-friendly
      });
    });

    stream.stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Error fetching audio stream" });
    });

  } catch (err) {
    console.error("Play-DL Error:", err);
    res.status(500).json({ error: "Error processing video. YouTube may have blocked the request." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
