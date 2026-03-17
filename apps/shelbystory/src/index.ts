import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { json } from "node:stream/consumers";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
const SECRET = process.env.JWT_SECRET;
const TIME_TO_LIVE = 30 * 24 * 60 * 60 * 1_000_000
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, chill bro 😅"
    });
  }
});
app.use("/api/upload", limiter);
app.use("/api/comment", limiter);
app.use("/api/react", limiter);
// fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve static
app.use(express.static(path.join(__dirname, "../")));

// route /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({
    success: false,
    error: err?.message || "The server is overloaded, please try again later."
  });
});
if (!process.env.SHELBY_ACCOUNT_PRIVATE_KEY) {
  throw new Error("Missing SHELBY_ACCOUNT_PRIVATE_KEY");
}
if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

const config = {
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
};

const shelbyClient = new ShelbyNodeClient(config);

const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.SHELBY_ACCOUNT_PRIVATE_KEY),
});

function randomId(){
  return crypto.randomUUID().replaceAll("-", "")
}
function createTime(){
   
  return Date.now()  +"_"+ crypto.randomUUID().slice(0,6)

}
app.get("/api/ping", async (req, res) => {
   console.log("ping");
   res.send("pong");
});


app.post("/api/upload",verifyToken, upload.single("file"), async (req, res) => {
  try {

    const file = req.file;
    const caption = req.body.caption;
    const author = (req as any).user.email.email;
    /* ---------- VALIDATE ---------- */

    if(!author){
      return res.status(400).json({error:"Author required"});
    }
     if(!file){
      return res.status(400).json({error:"No file uploaded"});
    }
    /* check file type */

    const allowedTypes = ["image/png","image/jpeg","image/webp","video/mp4"];

    if(!allowedTypes.includes(file.mimetype)){
      return res.status(400).json({error:"File type not supported"});
    }

    /* check file size (5MB) */

    if(file.size > 5 * 1024 * 1024){
      return res.status(400).json({error:"File too large (max 5MB)"});
    }

    if(!caption || caption.trim()===""){
      return res.status(400).json({error:"Caption required"});
    }

    if(caption.length >= 50){
      return res.status(400).json({error:"Caption too long (max 50)"});
    }

   
    if(caption.includes("_")){
  return res.status(400).json({
    error:"Caption cannot contain '_' character"
  });
}

    

    /* ---------- UPLOAD ---------- */

    const id = randomId();
    const timee = createTime();

    const blobName = id;

    await shelbyClient.upload({
      blobData: new Uint8Array(file.buffer),
      signer,
      blobName:id,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    await new Promise(r => setTimeout(r,10000));

    const post = {
      id:id,
      author:author,
      caption:caption,
      time:Date.now(),
      media:"https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/"+blobName
    }

    const jsonBytes = new TextEncoder().encode(JSON.stringify(post));

    const linkPost = "post_"+id+"_"+timee+"_"+author+"_"+caption;

    await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName: linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success:true,
      message:"Upload successful",
      blobName
    });

  } catch(err) {

    console.error(err);

    res.status(500).json({
      error:"Server error"
    });

  }
});

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

app.get("/api/list", async (req, res) => {
 const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
 
 // 3) Ask Shelby for a list of the account's blobs.
 const blobs = await shelbyClient.coordination.getAccountBlobs({ account });
const posts = blobs
  .filter(blob => blob.blobNameSuffix.startsWith("post"))
  .sort((a,b)=>{

    const timeA = Number(a.blobNameSuffix.split("_")[2])
    const timeB = Number(b.blobNameSuffix.split("_")[2])

    return timeB - timeA // mới nhất trước
  })
  const result = [];
  for (const post of posts) {
   const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.blobNameSuffix;

const res = await fetch(url)

const data = await res.json()

result.push(data);
console.log(data);
} 
res.json(result);

});
app.get("/api/getReact", async (req, res) => {
 const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
 
 // 3) Ask Shelby for a list of the account's blobs.
 const blobs = await shelbyClient.coordination.getAccountBlobs({ account });
const posts = blobs
  .filter(blob => {

    const type = blob.blobNameSuffix.split("_")[0]

    return type === "like" || type === "unlike"

  })
  .sort((a,b)=>{

    const timeA = Number(a.blobNameSuffix.split("_")[2])
    const timeB = Number(b.blobNameSuffix.split("_")[2])

    return timeB - timeA

  })
  const result = [];
  for (const post of posts) {
   const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.blobNameSuffix;

const res = await fetch(url)

const data = await res.json()

result.push(data);
console.log(data);
} 
res.json(result);

});
app.post("/api/react",verifyToken,upload.single("file"), async (req, res) => {
  try {
    const author = (req as any).user.email.email;
    const id = req.body.id;
    const type = req.body.type;
    const timee = createTime();
    if(!author){
      return res.status(400).json({error:"Author required"});
    }
      const react = {
      id: id,
      author: author,
      type : type,
      time: Date.now(),
    }
    const jsonString = JSON.stringify(react)
   const encoder = new TextEncoder()

const jsonBytes = encoder.encode(jsonString);
     const linkPost = type+"_" + id + "_" + timee +"_" + author;
     await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName : linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success: true,
      message: "React successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "React failed" });
  }
});
app.post("/api/comment",verifyToken,upload.single("file"), async (req, res) => {
  
  try {
    const author = (req as any).user.email.email;
    const id = req.body.id;
    const text = req.body.text;
    const timee = createTime();
     if(!author){
      return res.status(400).json({error:"Author required"});
    }
    // ❌ validate id
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid post id" });
    }

    // ❌ validate text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    // ❌ giới hạn độ dài
    if (text.length >= 100) {
      return res.status(400).json({ error: "Comment too long (max 100 chars)" });
    }

    // ❌ chống spam ký tự rác
    const cleanText = text.trim();

    // ❌ chống XSS cơ bản
    if (/<script>/i.test(cleanText)) {
      return res.status(400).json({ error: "Invalid content" });
    }
      const react = {
      id: id,
      author: author,
      comment : text,
      time: Date.now(),
    }
    const jsonString = JSON.stringify(react)
   const encoder = new TextEncoder()

const jsonBytes = encoder.encode(jsonString);
     const linkPost = "comment_" + id + "_" + timee +"_" + author + "_" + text;
     await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName : linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success: true,
      message: "React successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "React failed" });
  }
});
app.get("/api/getcomment/:id", async (req, res) => {
 const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
  const id = req.params.id;
 // 3) Ask Shelby for a list of the account's blobs.
 const blobs = await shelbyClient.coordination.getAccountBlobs({ account });
const posts = blobs
    .filter(blob => {
      const parts = blob.blobNameSuffix.split("_")
      return parts[0] === "comment" && parts[1] === id
    })
    .sort((a,b)=>{

      const timeA = Number(a.blobNameSuffix.split("_")[2])
      const timeB = Number(b.blobNameSuffix.split("_")[2])

      return timeB - timeA
    })

  const result = await Promise.all(

    posts.map(async(post)=>{

      const url =
        "https://api.testnet.shelby.xyz/shelby/v1/blobs/" +
        process.env.SHELBY_ACCOUNT_ADDRESS +
        "/" +
        post.blobNameSuffix

      const r = await fetch(url)
      return await r.json()

    })

  )

  res.json(result)


});
app.get("/api/feed", async (req, res) => {
  try {

    const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS)

    const blobs = await shelbyClient.coordination.getAccountBlobs({ account })

    const posts = []
    const comments = []
    const reacts = []

    for (const blob of blobs) {

      const name = blob?.blobNameSuffix
      if (!name) continue

      const parts = name.split("_")
      const type = parts[0]

      if (type === "post") posts.push(name)
      else if (type === "comment") comments.push(name)
      else if (type === "like" || type === "unlike") reacts.push(name)

    }

    // sort post mới nhất trước (dựa vào timestamp ở index 2)
    posts.sort((a, b) => {
      const ta = Number(a.split("_")[2]) || 0
      const tb = Number(b.split("_")[2]) || 0
      return tb - ta
    })

    res.json({
      posts,
      comments,
      reacts
    })

  } catch (err) {

    console.log("FEED ERROR:", err)

    res.status(500).json({
      posts: [],
      comments: [],
      reacts: []
    })

  }
})
app.post("/api/login",upload.single("file"), (req, res) => {

  const  email = req.body;
   console.log(email)

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = jwt.sign(
    { email: email },
    SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token: token,
    email: email
  });

});
export function verifyToken(req: any, res: any, next: any){

  const authHeader = req.headers.authorization;

  if(!authHeader){
    return res.status(401).json({error:"No token"});
  }

  const token = authHeader.split(" ")[1];

  try{

    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;

    next();

  }catch(e){

    res.status(401).json({error:"Invalid token"});

  }

}
