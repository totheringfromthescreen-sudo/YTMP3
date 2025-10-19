import express from "express";
import ytdl from "ytdl-core";
import { PassThrough } from "stream";

const app = express();

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing YouTube URL");

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");

    const audioStream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
    const bufferChunks = [];

    audioStream.on("data", (chunk) => bufferChunks.push(chunk));
    audioStream.on("end", () => {
      const audioBuffer = Buffer.concat(bufferChunks);

      res.json({
        title: info.videoDetails.title,
        audio: audioBuffer.toString("base64")
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing video");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
