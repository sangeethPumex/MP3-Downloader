const AWS = require('aws-sdk');
const ytdl = require('ytdl-core');
const { PassThrough } = require('stream');

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Function to download video from YouTube and upload directly to S3
const downloadToS3 = async (req, res) => {
    const videoUrl = req.body.url;

    try {
        // Get YouTube video information
        const videoId = ytdl.getURLVideoID(videoUrl);
        const videoTitle = `youtube-video-${videoId}.mp4`;

        // Create a PassThrough stream to stream directly to S3
        const passThroughStream = new PassThrough();

        // Start downloading the video from YouTube
        console.log(`Starting download of video from YouTube: ${videoUrl}`);
        
        const videoStream = ytdl(videoUrl, { quality: 'highest' });

        let downloadedBytes = 0;
        let totalBytes = 0;

        // Handle video stream response to get total size
        videoStream.on('response', (response) => {
            totalBytes = parseInt(response.headers['content-length'], 10);
            console.log(`Total video size: ${totalBytes} bytes`);
        });

        // Handle data events to track download progress
        videoStream.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            console.log(`Download progress: ${progress}%`);
        });

        // Handle errors during streaming
        videoStream.on('error', (err) => {
            console.error('Error during video stream:', err);
            res.status(500).json({ error: 'Failed to stream YouTube video' });
        });

        // Pipe video stream to PassThrough stream
        videoStream.pipe(passThroughStream);

        // Define S3 upload parameters
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: videoTitle,
            Body: passThroughStream,
            ContentType: 'video/mp4'
        };

        // Upload to S3
        console.log('Uploading video to S3...');
        s3.upload(s3Params)
            .on('httpUploadProgress', (progress) => {
                console.log(`S3 Upload Progress: ${progress.loaded} bytes uploaded`);
            })
            .promise()
            .then((uploadResult) => {
                console.log(`Uploaded video to S3: ${uploadResult.Location}`);
                res.status(200).json({
                    message: 'Video downloaded and uploaded to S3 successfully',
                    s3Url: uploadResult.Location
                });
            })
            .catch((uploadError) => {
                console.error('Error uploading video to S3:', uploadError);
                res.status(500).json({ error: 'Failed to upload video to S3' });
            });

    } catch (error) {
        console.error('Error during video download or S3 upload:', error);
        res.status(500).json({ error: 'An error occurred during processing' });
    }
};

module.exports = { downloadToS3 };
