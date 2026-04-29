const { exiftool } = require("exiftool-vendored");

async function run() {
  try {
    const tags = await exiftool.read("C:\\Users\\syj24\\Downloads\\IMG_0266.CR3");
    console.log("Model:", tags.Model);
    console.log("Make:", tags.Make);
    console.log("ShutterCount:", tags.ShutterCount);
    console.log("ImageCount:", tags.ImageCount);
    console.log("FileNumber:", tags.FileNumber);
    console.log("ImageNumber:", tags.ImageNumber);
    console.log("FileIndex:", tags.FileIndex);
    
    // Dump keys that match count, number, shutter
    for (const key of Object.keys(tags)) {
      if (key.toLowerCase().includes("count") || key.toLowerCase().includes("shutter") || key.toLowerCase().includes("number") || key.toLowerCase().includes("index")) {
        console.log(`${key}: ${tags[key]}`);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await exiftool.end();
  }
}
run();
