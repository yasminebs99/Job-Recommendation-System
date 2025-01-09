# Job-Recommendation-System
## Introduction
you will design a job recommendation system using embeddings and similarity search. You will use Hugging Face's HfInference for generating text embeddings and a database that stores vectors for storing and querying these embeddings. The system will recommend job postings based on a given query, such as finding positions for a specific job title in a particular location.
you will allow candidates to provide their resume in a PDF format to this Job Recommendation System. It will also recommend jobs from the database based on the skill set and experience by extracting information from the resume and looking for matches in the data set to recommend jobs.
## Learning objectives
* Develop a recommendation system using a database that stores vector data and Hugging Face tools for generating vector embeddings
* Use pretrained NLP models for classification and similarity searches to extract and match criteria from natural language queries.
* Accurately return items in the database that match users' search terms via recommendation algorithms
* Refine and optimize recommendation accuracy for user searches
* Allow users to search the database by providing a PDF

## Part 1 Task 1: Setting up and populating ChromaDB
In Task 1, you will set up the evnironment to run the database, in this case, Chroma DB. Then, you will populate the Chroma DB instance with a collection created out of your data set.
Part 1 Task 1: A. Install the ChromaDB environment
To install the ChromaDB environment, copy and paste the following code into a new terminal window and press Enter.

npm install chromadb 

Install one more dependency by running the following command in the same terminal window where you installed the previous dependency.

npm install @huggingface/inference

The @huggingface/inference package provides capabilities to use Hugging Face inference to use AI-based models.

Part 1 Task 1: B. Run Docker
In your IDE environment, select the Terminal tab at the top right of the window and then select New Terminal from the drop-down menu.
Run the Docker command to pull a ChromaDB image.
Docker lets you create and run applications in the form of packages. Instead of manually downloading and installing ChromaDB, Docker helps you configure the database by pulling the image from a pre-configured environment.
To create a suitable environment to run a ChromaDB instance, run the following command:

docker run -p 8000:8000 chromadb/chroma

When you run the command above the ChromaDB database, the image runs in a Docker container. Let's examine the code in detail.
docker run: This command creates the Docker environment, which is needed to pull images and then configure environments.
p 8000:8000: This code specifies that port 8000 on the left side is for the container, which then maps to port 8000 on the right side of your host machine.
chromadb/chroma: This instruction tells Docker which image needs to be pulled. In this instance, the Chroma database program in the chromadb/chroma image is in use.
This code begins installing and running essential Docker packages. If Docker runs smoothly, then during the last phase of running this command, you will see the message "Uvicorn running on http://0.0.0.0:8000 ," as shown in the following screenshot.

*********************Important! Please keep this terminal window open. The lab requires Docker execution until the end of the lab.***********************************************

Install Docker: Download and install Docker Desktop for your laptop's operating system from the official Docker website.
Run ChromaDB in a Docker container: You can find instructions for running ChromaDB as a Docker image in the ChromaDB official documentation.

Creat new file named jobRecommendationSystem.js.
Part 1 Task 1: C. Import necessary modules
Now, import the ChromaClient class from the chromadb package into your foodRecommendationSystem.js file. By importing the ChromaClient class, you can create an instance of the client that interacts with the ChromaDB database. To import the class, use the require keyword. Include the following command in jobRecommendationSystem.js.

const { ChromaClient } = require("chromadb");
const client = new ChromaClient();

Now import the Hugging Face inference model and include the Hugging Face API key generated in the previous lesson.

const { HfInference } = require("@huggingface/inference");
const hf = new HfInference("your_huggingface_api_key");

The above code imports the HfInference class from @huggingface/inference package. You enable the API key within the variable hf by using HfInference.

Part 1 Task 1: D. Get the data
In this section, you will create a collection out of a provided data set FoodDataSet.js within the main() function.
First, you need to obtain a copy of the data. Execute the following command to load FoodDataSet.js file under the Project folder.

wget https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/CBCVVX4wJjXG64DKYMVi1w/FoodDataSet.js

This data set includes multiple objects that hold keys. Each object key provides specific information about a food item, such as its nutritional content, ingredients, and preparation details.
jobId
jobTitle
company
location
jobType
salary
jobDescription
jobResponsibilities
preferredQualifications
applicationDeadline

const jobPostings = require('./jobDataSet.js');

Part 1 Task 1: E. Create the collection
Now create one varibale named collectionName and assign job_collection to a string in the jobRecommendationSystem.js.

const collectionName = "job_collection";

Create the asynchronous main() function in jobRecommendationSystem.js file. This function will contain the code for interacting with the ChromaDB database.

async function main() {
  try {
    //working code goes here
  } catch (error) {
    console.error("Error:", error);
  }
 }

This code includes try and catch for error handling. The try block will contain the code that potentially may throw an error. The catch block contains code that executes if an error occurs in the try block, allowing you to handle the error gracefully.
Create the collection inside the try block of the main() function.

const collection = await client.getOrCreateCollection({ name: collectionName });

This code retrieves or creates the collection named job_collection from the database using the client's getOrCreateCollection() method.

The getOrCreateCollection() method ensures a collection exists in the database, either by retrieving an existing collection or by creating a new collection if a collection doesn't already exist.

## Part 1 Task 2: Create unique food IDs and generate embeddings
Part 1 Task 2: A. Create unique IDs
Now that you've created the collection, you need to create identifiers so each item in your collection has a unique ID.
To create the unique job IDs, you will use the Set() method for all of the food items that you require from the jobDataSet.js in the array named jobItems. Place this function in the try block of your main() function.

const uniqueIds = new Set();
        jobPostings.forEach((job, index) => {
            while (uniqueIds.has(job.jobId.toString())) {
                job.jobId = `${job.jobId}_${index}`;
            }
            uniqueIds.add(job.jobId.toString());
        });



Defines a set named uniqueIds which will store unique jobId values.
The forEach() method iterates over each job item and its index in the jobPostings array.
The while loop checks if jobId already exists in the uniqueIds set.
If jobId is already in the set, it appends the index to jobId to make it unique.
The potentially updated jobId is added to the uniqueIds set.
Now, you need to process your array of jobPostings so you can generate embeddings and store the data in a collection within main() function after the previous step.
Note in order to store this data in the fjobTexts array, we will need to call the generateEmbeddings() function, which you have not yet defined. You will do so in the step that follows.


const jobTexts = jobPostings.map((job) => `${job.jobTitle}. ${job.jobDescription}. ${job.jobType}. ${job.location}. Responsibilities: ${job.jobResponsibilities.join(", ")}. Qualitifcations: ${job.preferredQualifications.join(", ")}.`);

        const embeddingsData = await generateEmbeddings(jobTexts);

        await collection.add({
            ids: jobPostings.map((job) => job.jobId.toString()),
            documents: jobTexts,
            embeddings: embeddingsData,
        });
        
Include the above listed code after you generate the unique id's for all job items. Here is how the above code works:
The map() method transforms each job item into a string combining its jobTitle, jobDescription,.. and a comma-separated list 
The resulting array of text descriptions is stored in jobTexts.
Generate embeddings:
The generateEmbeddings() function is called with the jobTexts parameter to create embeddings for the text descriptions. (We will define this function in the next step.)
The result is stored in an array named embeddingsData.
Store the data in the collection:
The add() method of the collection processes the data.
This method converts the data to strings and stores the data in the food_id values as IDs, the text descriptions as documents, and the generated embeddings as embeddings.
## Part 1 Task 2: B. Create function to generate embeddings
Now, let's write the function to actually generate the embeddings. It will use a function from the Hugging Face model, named featureExtraction().
Place the generateEmbeddings() outside of the main() function. It will generate embeddings for the user's search strings and for the data.
For this, you need to use the featureExtraction() method to specify you want to use the Hugging Face feature extraction model.

async function generateEmbeddings(texts) {
    const results = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: texts,
    });
    return results;
}

Let's review how this asynchronous function works.
The generateEmbeddings() function takes a single paramter, texts, an array of text strings. The function does the following:
Extracts features
The function calls hf.featureExtraction() with an object containing:
The model to use for feature extraction, in this case, sentence-transformers/all-MiniLM-L6-v2.
The inputs array stores text strings for which it will generate the embeddings.
Awaits and returns the results
The function waits for the hf.featureExtraction() call to complete using await and stores the resulting embeddings in results.
Finally, the function returns results containing the generated embeddings.
## Part 1 Task 3: Extract criteria to filter the data
For this task, you will use the queries to extract criteria on which you will filter your data. You will need three functions in this section.
A helper function to classify text and labels named classifyText().
You will use the classifyText() function inside of extractFilterCriteria(), which allows you to extract criteria from the data and classify it according to a given set of labels.
Lastly, you will define a function to filter your job items based on that set of labels.
## Part 1 Task 3: A. Create the function to classify text and add labels
You will definite a function which will classify input text according to one or more provided candidate labels. It will use the BART large model, fine-tuned for multi-label natural language inference (MNLI). In part, the function will return an object with a score property between 0 and 1, indicating how close the model finds the label to the input text. You can use this function for tasks such as sentiment analysis, topic classification, and other text classification problems.
Create the function named classifyText() outside main() function to classify given text based on specified labels using a pretrained model.

async function classifyText(word, labels) {
    const response = await hf.request({
        model: "facebook/bart-large-mnli",
        inputs: word,
        parameters: { candidate_labels: labels },
    });
    return response;
}

Let's review how this function works.
classifyText()
Defines an asynchronous function named classifyText() that takes two parameters: text and labels.
hf.request()
Sends a request to the Hugging Face API hf.request.
Uses the facebook/bart-large-mnli model for natural language inference (NLI).
Provides any text as input to the model.
Specifies labels as candidate labels for classification.
response
The function returns a response object from the API. The response object contains a score property for each label, indicating how closely related the model calculates the label is to the query on a scale of 0 to 1.
## Part 1 Task 3: B. Create a function to extract the criteria
Now, create the extractFilterCriteria() function outside of the main() function. This asynchronous function will evaluate how descriptive provided criteria, called labels, are relative to the input query.

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

Let's review how extractFilterCriteria() works.
This asynchronous function will extract the location, job title, job type, and company name from a query string. Follow the steps below to create extractFilterCriteria().

The function should take a single parameter, query.
Initialize an object named criteria with the location, jobTitle, jobType, and company properties, set to null.
Then create one variable named `labels’ which is initialized as array with elements such as location, job title, company, and job type.
Define the variable named words and assign query to words using the split() method.
Call the classifyText() function with word and labels as parameters and assign the result to a variable named result.
The result contains labels and scores.
Store the label with the highest score in highestJobScoreLabel, and its highest score in score variable.
The code checks if a score is greater than 0.5 and, based on the value of highestScoreLabel, updates the criteria object with the word under properties like location, jobTitle, company, or jobType. If highestScoreLabel doesn't match any case, it does nothing.
Write a conditional statement that checks if the classification score is greater than 0.5. If the score exceeds this threshold, it means the classification is considered confident enough to proceed.
switch (highestScoreLabel): This switch statement determines what action to take based on the label with the highest classification score.
case location: If the highest score label is "location," it sets the criteria.location to word.
case job title: If the highest score label is "job title," it sets the criteria.jobTitle to word.
case company: If the highest score label is "company," it sets the criteria.company to word.
case job type: If the highest score label is "job type," it sets the criteria.jobType to word.
Returns the criteria object.

Now, inside the main() function of the foodRecommendationSystem.js file, create a variable named query and assign it a string value as shown below.

const query = "Creative Studio";

Include the code before the try block within the main() function.
Within the try block of the main() function, call the extractFilterCriteria() function and assign its return value to the variable named filterCriteria. Pass the query string variable into the function as a parameter.

const filterCriteria = await extractFilterCriteria(query);

## Part 1 Task 4: Create a function to perform the similarity search
Next, you need to perform a similarity search to compare your user query embeddings to your collection data embeddings.
Create the performSimilaritySearch() function outside the main() function. The asynchronous function performSimilaritySearch() will conduct a similarity search using embeddings with three arguments: collection, queryTerm, and filterCriteria.

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

The performSimilaritySearch() function performs a similarity search using embeddings. Let's review how this code works.
generateEmbeddings([queryTerm]) asynchronously generates embeddings for the queryTerm using a pre-trained model, typically designed for natural language processing tasks like sentence similarity.
The collection.query() method searches for items in the collectionName collection similar to queryTerm. It provides queryEmbedding as the input and requests up to 5 results n: 5.
If no similar results were found or results.length === 0, log a message and return an empty array.
If results are found, map over the ids array in results to retrieve corresponding food items from the jobPostings array using their  jobId. For each matching jobPostings, include its similarity score from results.distances.
Sort topJobItems based on their score in ascending order a.score - b.score. This step ensures that the most similar items to the query appear first in the returned array.
Catch any errors that occur during the process, such as network errors and API failures using the try-catch block. If an error occurs, log the error message to the console and return an empty array.
Within the main() function, call the similarity search on query and collection where you stored the embeddings.

const initialResults = await performSimilaritySearch(collection, query, filterCriteria);

After getting the result, iterate over the first five items in the initialResults array inside the main() function and log each item's jobTitle along with its ranking.

initialResults.slice(0, 5).forEach((item, index) => {console.log(`Top ${index + 1} Recommended Job Name ==>, ${item.jobTitle}`);
});

Include the above code after calling the performSimilaritySearch() function within the main() function.
The method initialResults.slice(0, 5) slices the initialResults array to select the first five items, slice(0, 5). This ensures only the top five recommended job  are considered for logging.
The forEach() method iterates over each item and provides their corresponding index.
Inside the forEach loop, console.log() prints a message for each item.
${index + 1} displays the ranking of the food item, starting from 1.
"Recommended job Name ==> " is a descriptive label indicating the type of information displayed.
item.jobTitle prints the name of the food from the jobTitle property of the item object.
Now call the main() function at the end of the file.

main()
