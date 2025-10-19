import express from "express";
import ytdl from "ytdl-core";
import { PassThrough } from "stream";

const app = express();

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing YouTube URL" });

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");

    const audioStream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
    const chunks = [];

    audioStream.on("data", (chunk) => chunks.push(chunk));
    audioStream.on("end", () => {
      const audioBuffer = Buffer.concat(chunks);
      const base64Audio = audioBuffer.toString("base64");

      res.json({
        title: info.videoDetails.title,
        lengthSeconds: info.videoDetails.lengthSeconds,
        audio: base64Audio
      });
    });

    audioStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Stream error" });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing video" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
