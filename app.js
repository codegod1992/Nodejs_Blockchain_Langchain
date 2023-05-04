const http = require('http');

const hostname = '127.0.0.1';
const port = 3001;
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { OpenAI } = require("langchain/llms/openai");
const { loadQAStuffChain } = require("langchain/chains");

const OPENAI_API_KEY = '';
const PINECONE_API_KEY = '';
const PINECONE_API_ENV = '';
const PINECONE_INDEX_NAME = 'auto-gpt';
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
  res.end('Hello Worlda');
});
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question(`Do you want to store output.txt file to your pinecone? [Y/n]`, async yes_or_no => {
    if(yes_or_no == "y" || yes_or_no == "Y")
    {
        storeEmbedded('output.txt')        
    }
    else
    {
        getanswer("What is pixel dog?")
    }
    readline.close();
});

const getanswer = async (query) => {
    console.log("1")
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: OPENAI_API_KEY,
      });
    console.log("2")

      const client = new PineconeClient();
      await client.init({
        environment: PINECONE_API_ENV,
        apiKey: PINECONE_API_KEY,
      });
    console.log("3")

      const index_name = PINECONE_INDEX_NAME;
      const pineconeIndex = client.Index(index_name);
      const docSearch = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex:pineconeIndex,
        namespace: "blockchainpncn"
      });
      console.log("4")
    
      const searchResults = await docSearch.similaritySearch(query, 5);
      console.log("5")
    
      const llm = new OpenAI({
        openAIApiKey: OPENAI_API_KEY,
      });
      console.log("6")
    
      const chain = loadQAStuffChain(llm);
    console.log("7")

      const responseAns = await chain.call({
        input_documents: searchResults,
        question: query,
      });
    console.log("8")

      console.log(responseAns);
}
const storeEmbedded = async (textFile) => {
    try{
        const loader = new TextLoader(textFile);
        console.log("1")

        const documents = await loader.load();
        console.log("2")

        const textSplitter = new RecursiveCharacterTextSplitter({
          chunk_size: 1000,
          chunk_overlap: 10,
        });
        console.log("3")

        const texts = await textSplitter.splitDocuments(documents);
        console.log("4")
      
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: OPENAI_API_KEY,
        });
        console.log("5")

        const client = new PineconeClient();
        await client.init({
          environment: PINECONE_API_ENV,
          apiKey: PINECONE_API_KEY,
        });
        console.log("6")

        const index_name = PINECONE_INDEX_NAME;
        const pineconeIndex = client.Index(index_name);
        await PineconeStore.fromDocuments(texts, embeddings, {
            pineconeIndex:pineconeIndex,
            namespace : "nodepncn"
        });
        console.log("1")

        return "success";
    }catch(error){
        console.log("error", error)
        return "error";
    }
};
