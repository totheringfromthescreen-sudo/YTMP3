import express from "express";
import ytdl from "ytdl-core";

const app = express();

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");

    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept-Language": "en-US,en;q=0.9"
        }
      }
    });

    const chunks = [];
    audioStream.on("data", (chunk) => chunks.push(chunk));

    audioStream.on("end", () => {
      const audioBuffer = Buffer.concat(chunks);
      res.json({
        title: info.videoDetails.title,
        lengthSeconds: info.videoDetails.lengthSeconds,
        audio: audioBuffer.toString("base64") // field is now "audio"
      });
    });

    audioStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Error fetching audio stream" });
    });

  } catch (err) {
    console.error("YTDL Error:", err);
    res.status(500).json({ error: "Error processing video" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
