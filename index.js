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

    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      requestOptions: {
        headers: { "User-Agent": "Mozilla/5.0" }
      }
    });

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");

    const pass = new PassThrough();
    audioStream.pipe(pass).pipe(res);

    audioStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).send("Error downloading audio");
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error processing video");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
