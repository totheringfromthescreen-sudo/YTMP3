import express from "express";
import ytdl from "ytdl-core";

const app = express();

app.get("/", (req, res) => {
  res.send("YouTube Audio Downloader API is running!");
});

app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing YouTube URL");

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);

    ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing video");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
