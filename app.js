// app.js
const express = require('express');
const multer = require('multer');
const upload = multer({dest:'uploads/'});
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the templating enginen
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/', async(req, res) => {
  res.render('index');
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


//route for file upload and subsequent processing
app.post('/upload', upload.array('files', 10), async (req,res) =>{

  try{
      //confirmation of file upload + extraction
      console.log('Files received:', req.files);
      //res.send('Multiple files uploaded');
      const filePaths = req.files.map(file => file.path);
      console.log('Processing file: ', filePaths[0]);
  
      //extract the text from the uploaded file
      //# only using first file for testing purposes
      const extractedText = await extractText(filePaths[0]);
      console.log('Hey Ben This is the final extracted text:', extractedText);
  

      //summarize the test

      //render the result
      res.send(extractedText);

  } catch (error){
    console.error('Error during file processing: ', error);
    res.status(500).send('Error');
  }
});

async function extractText(uploadedFilePath){

    //call to OCR API
  
  try {
   
    const myProjectId = 'notesbyblu';
    const myLocation = 'us'; // Format is 'us' or 'eu'
    const myProcessorId = '55c6d57100d53657'; // Create processor in Cloud Console
   


    return await quickstart(myProjectId, myLocation, myProcessorId, uploadedFilePath);
  } catch (error){
      console.error('Error occured: ', error);
      throw error;
    }
  

};

//worker function for the text extraction via Google Cloud Document AI
async function quickstart(projectId, location, processorId, filePath) {

  try{

    const {DocumentProcessorServiceClient} =
    require('@google-cloud/documentai').v1;

    // Instantiates a client
    // apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
    // const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
    const client = new DocumentProcessorServiceClient();
  // The full resource name of the processor, e.g.:
  // projects/project-id/locations/location/processor/processor-id
  // You must create new processors in the Cloud Console first
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Read the file into memory.
    const fs = require('fs').promises;
    const imageFile = await fs.readFile(filePath);

    // Convert the image data to a Buffer and base64 encode it.
    const encodedImage = Buffer.from(imageFile).toString('base64');

    const request = {
      name,
      rawDocument: {
        content: encodedImage,
        mimeType: 'image/png',
      },
    };

    // Recognizes text entities in the jpeg screenshot
    const [result] = await client.processDocument(request);
    const {document} = result;

    // Get all of the document text as one big string
    const {text} = document;

    // Extract shards from the text field
    const getText = textAnchor => {
      if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
        return '';
      }

      // First shard in document doesn't have startIndex property
      const startIndex = textAnchor.textSegments[0].startIndex || 0;
      const endIndex = textAnchor.textSegments[0].endIndex;
      return text.substring(startIndex, endIndex);
    };

    

    // Read the text recognition output from the processor
    //console.log('The document contains the following paragraphs:');
    const [page1] = document.pages;
    const {paragraphs} = page1;

    let fullText = '';
    for (const paragraph of paragraphs) {
      paragraphText  = getText(paragraph.layout.textAnchor);
      fullText += paragraphText + "\n";
      //console.log(`Paragraph text:\n${paragraphText}`);
    }

    // console.log('Extracted text', fullText);
    return fullText;
  } catch(error){
    console.error('Error occured:', error);
    throw error;
  }
};


async function summarizeText(text){
  //call to LLM
}

