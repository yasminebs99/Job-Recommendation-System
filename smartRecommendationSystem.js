const fs = require("fs");
const pdf = require("pdf-parse");
const { HfInference } = require("@huggingface/inference");
const readline = require("readline");
const { ChromaClient } = require("chromadb");

const hf = new HfInference("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");

const chroma = new ChromaClient();
const collectionName = "job_collection";

const jobPostings = require("./jobPostings.js");

async function extractTextFromPDF(filepath){
    try{
        const dataBuffer = fs.readFileSync(filepath);
        const data = await pdf(dataBuffer);
        const text = data.text.replace(/\n/g, " ").replace(/ +/g, " ");
        return text;
    } catch (err) {
        console.error("Error extracting text from PDF:", err);
        throw err;
    }
}

async function generateEmbeddings(texts){
    try{
        const results = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: texts
        });
        return results
    } catch (err){
        console.error("Error converting text to embeddings:", err);
        throw err;
    }
}

function promptUserInput(query){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function extractFromPDF(filepath){
    try{
        const dataBuffer = fs.readFileSync(filepath);
        const data = await pdf(dataBuffer);
        const text = data.text.replace(/\n/g, " ").replace(/ +/g, " ");
        return text;
    } catch (err) {
        console.error("Error extracting text from PDF:", err);
        throw err;
    }
}

async function storeEmbeddings(text){
    const jobEmbeddings = [];
    const metadatas = jobPostings.map(() => ({})); // Empty metadata objects

    for (const job of jobPostings){
        const embedding = await generateEmbeddings(job.jobDescription.toLowerCase());
        jobEmbeddings.push(embedding);
    }

    const ids = jobPostings.map((_, index) => index.toString());
    const jobTexts = jobPostings.map((job) => job.jobTitle);

    try{
        const collection = await chroma.getOrCreateCollection({name: collectionName});

        await collection.add({
            ids: ids,
            documents: jobTexts,
            embeddings: jobEmbeddings,
            metadatas: metadatas
        });
    } catch (error){
        console.error("Error storing embeddings in Chroma DB:", error);
        throw error;
    }
}

async function main(){
    try{
        await storeEmbeddings(jobPostings);

        const filePath = await promptUserInput("Enter the path to the candidate's resume PDF: ");
        const text = await extractTextFromPDF(filePath);
        
        if (text.length > 0){
            const resumeEmbedding = await generateEmbeddings(text.toLowerCase());

            const collection = await chroma.getCollection({name: collectionName});
            const results = await collection.query({
                queryEmbeddings: [resumeEmbedding],
                n: 5
            });
            
            if (results.ids.length > 0 && results.ids[0].length > 0){
                console.log("Recommenden Jobs:");
                results.ids[0].forEach((id, index) => {
                    const recommendedJob = jobPostings[parseInt(id)];
                    console.log(`Top ${index + 1} Recommended Job ==> ${recommendedJob.jobTitle}`);
                });
            }
            else{
                console.log("No similar jobs found.");
            }
        }
        else{
            console.log("No text found in the resume.");
        }
    } catch(err){
        console.error("An error occurred:", err);
        throw err;
    }
}

main();