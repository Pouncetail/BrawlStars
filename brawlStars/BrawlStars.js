process.stdin.setEncoding("utf8");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  
const MONGO_CONNECTION_STRING = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.rrl20.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = MONGO_CONNECTION_STRING;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });

const api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjNlNDZiNDFhLTQyZGUtNGYxOC05ZjA2LTZhMmNjYmYzODc0NCIsImlhdCI6MTczNDEzNDAwMSwic3ViIjoiZGV2ZWxvcGVyL2M0MjgwMTMwLTE1MjgtMjgxMS05NjRmLTFiN2ZhNmZmNjVhNyIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNDUuNzkuMjE4Ljc5Il0sInR5cGUiOiJjbGllbnQifV19.Qht6vmS2zb9i9T6SyRC0fFwqR_HDmhyaNwlCEXb4nJvXsulW1bIRGFmE7XlBv-r-Jz4DBLAyEYOv-QBaH3BJjg"

if (process.argv.length !== 3){
	console.log("Usage brawlStars.js portNumber");
	process.exit(0)
}

const portNumber = process.argv[2];
console.log(`Web server is running at http://localhost:${portNumber}/`);

async function close() {
    await client.close();
}

console.log("Stop to shutdown the server: ");
process.stdin.on('readable', () => {
	const input = process.stdin.read();
	if (input !== null) {
		const command = input.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            close();
            process.exit(0);
		} else {
			console.log(`Invalid command: ${command}`);
		}
		console.log("Stop to shutdown the server: ");
		process.stdin.resume();
    }
});

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
	response.render('intro');
});

app.get("/voting", (request, response) => {
	fetch('https://api.brawlstars.com/v1/brawlers', 
		{method: 'GET',
		headers: {
			Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjNlNDZiNDFhLTQyZGUtNGYxOC05ZjA2LTZhMmNjYmYzODc0NCIsImlhdCI6MTczNDEzNDAwMSwic3ViIjoiZGV2ZWxvcGVyL2M0MjgwMTMwLTE1MjgtMjgxMS05NjRmLTFiN2ZhNmZmNjVhNyIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNDUuNzkuMjE4Ljc5Il0sInR5cGUiOiJjbGllbnQifV19.Qht6vmS2zb9i9T6SyRC0fFwqR_HDmhyaNwlCEXb4nJvXsulW1bIRGFmE7XlBv-r-Jz4DBLAyEYOv-QBaH3BJjg',
		}}).then(response => response.json())
	.then(data => {
		let brawl = "";
		console.log(data)
		data.forEach(brawler => {
			brawl += `<option>${brawler.name}</option>`;
		})
		const variable = {
			brawlers: brawl
		}
		response.render('voting', variable);
	})
});

async function insertOne(insert){
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(insert);
}

app.get("/processVoting", (request, response) => {
	let {name, vote} = request.body;
	let insert = {username: name, votes: vote}
	insertOne(insert);
	const variable = {
		username: name,
		votes: vote
	}
	response.render('processVoting', variable);
});

async function getAll(){
	return client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find().toArray();
}

app.get("/ranking", (request, response) => {
	let arr = [];
	let cursor = getAll();
	cursor.forEach(user => {
		if (arr.some(brawl => brawl.name == user.votes)){
			let charac = arr.find(brawl => brawl.name == user.votes);
			charac = {name: charac.name, votes: charac.votesvotes+1};
		} else {
			arr[arr.length] = {name: user.votes, votes: 1};
		}
	})
	
	fetch("https://api.brawlstars.com/v1/brawlers").then(response => response.json())
	.then(data => {
		let arr = [];
		data.forEach(brawler => {
			if (!arr.some(brawl => brawl.name == brawler.name)){
				let voter = {name: brawler.name, votes: 0};
				arr[arr.length] = voter;
			}
		})
		arr.sort((a, b) => a.votes - b.votes);
	})
	let table = `<table border=1><tr><th>Name</th><th>GPA</th></tr>`;
	arr.forEach(e => {
		table += `<tr><td> ${e.name} </td><td> ${e.votes} </td></tr>`;
	});
	table += '</table><br>';
	const variable = {
		rankings: table
	}
	response.render('displayGPA', variable);
});

app.listen(portNumber);