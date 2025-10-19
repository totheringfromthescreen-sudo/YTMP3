import express from "express";
import play from "play-dl";
import { PassThrough } from "stream";

const app = express();

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    // Fetch video info
    const info = await play.video_info(url);
    const title = info.video_details.title.replace(/[^\w\s]/gi, "");

    // Get audio stream
    const stream = await play.stream(url, { quality: 2 }); // 2 = high audio

    const chunks = [];
    stream.stream.on("data", (chunk) => chunks.push(chunk));

    stream.stream.on("end", () => {
      const audioBuffer = Buffer.concat(chunks);
      const audioBase64 = audioBuffer.toString("base64");

      // Return JSON with renamed field
      res.json({
        title: info.video_details.title,
        lengthSeconds: info.video_details.durationInSec,
        audio: audioBase64
      });
    });

    // Handle stream errors
    stream.stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Error fetching audio stream" });
    });

  } catch (err) {
    console.error("Play-DL Error:", err);
    res.status(500).json({ error: "Error processing video" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
