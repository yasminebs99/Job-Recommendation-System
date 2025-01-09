const { ChromaClient } = require("chromadb");
const client = new ChromaClient();

const { HfInference } = require("@huggingface/inference");
const hf = new HfInference("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");

const jobPostings = require('./jobPostings.js');

const collectionName = "job_collection";

async function main() {
    try {

        const collection = await client.getOrCreateCollection({ name: collectionName });

        const uniqueIds = new Set();
        jobPostings.forEach((job, index) => {
            while (uniqueIds.has(job.jobId.toString())) {
                job.jobId = `${job.jobId}_${index}`;
            }
            uniqueIds.add(job.jobId.toString());
        });

        const jobTexts = jobPostings.map((job) => `${job.jobTitle}. ${job.jobDescription}. ${job.jobType}. ${job.location}. Responsibilities: ${job.jobResponsibilities.join(", ")}. Qualitifcations: ${job.preferredQualifications.join(", ")}.`);

        const embeddingsData = await generateEmbeddings(jobTexts);

        await collection.add({
            ids: jobPostings.map((job) => job.jobId.toString()),
            documents: jobTexts,
            embeddings: embeddingsData,
        });

        const query = "Creative Studio";

        const filterCriteria = await extractFilterCriteria(query);

        const initialResults = await performSimilaritySearch(collection, query, filterCriteria);
        initialResults.slice(0, 5).forEach((item, index) => {
            console.log(`Top ${index + 1} Recommended Job Title ==> ${item.jobTitle}, ${item.jobType}, ${item.jobDescription}, ${item.company}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
};

async function generateEmbeddings(texts) {
    const results = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: texts,
    });
    return results;
}

async function classifyText(word, labels) {
    const response = await hf.request({
        model: "facebook/bart-large-mnli",
        inputs: word,
        parameters: { candidate_labels: labels },
    });
    return response;
}

async function extractFilterCriteria(query) {
    const criteria = { location: null, jobTitle: null, company: null, jobType: null };
    const labels = ["location", "job title", "company", "job type"];

    const words = query.split(" ");
    for (const word of words) {
        const result = await classifyText(word, labels);
        console.log('result', result);
        const highestScoreLabel = result.labels[0];
        const score = result.scores[0];

        if (score > 0.5) {
            switch (highestScoreLabel) {
                case "location":
                    criteria.location = word;
                    break;
                case "job title":
                    criteria.jobTitle = word;
                    break;
                case "company":
                    criteria.company = word;
                    break;
                case "job type":
                    criteria.jobType = word;
                    break;
                default:
                    break;
            }
        }
    }
}

async function performSimilaritySearch(collection, queryTerm, filterCriteria) {
    try {
        const queryEmbedding = await generateEmbeddings([queryTerm]);
        console.log(filterCriteria);
        const results = await collection.query({
            collection: collectionName,
            queryEmbeddings: queryEmbedding,
            n: 3,
        });

        if (!results || results.length === 0) {
            console.log(`No job postings found similar to "${queryTerm}"`);
            return [];
        }

        let topJobPostings = results.ids[0].map((id, index) => {
            return {
                id,
                score: results.distances[0][index],
                jobTitle: jobPostings.find(item => item.jobId.toString() === id).jobTitle,
                jobDescription: jobPostings.find(item => item.jobId.toString() === id).jobDescription,
                jobType: jobPostings.find(item => item.jobId.toString() === id).jobType,
                location: jobPostings.find(item => item.jobId.toString() === id).location
            };
        }).filter(Boolean);

        return topJobPostings.sort((a, b) => a.score - b.score);
    } catch (error) {
        console.error("Error during similarity search:", error);
        return [];
    }
}

main();